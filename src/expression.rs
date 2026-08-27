use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum EvalResult {
    Known { value: Value, display: String },
    Unknown { reason: String },
    Error { message: String },
}

impl EvalResult {
    pub fn truthy(&self) -> Option<bool> {
        match self {
            Self::Known { value, .. } => Some(truthy(value)),
            _ => None,
        }
    }
}

pub fn evaluate(source: &str, context: &Value) -> EvalResult {
    evaluate_with_metadata(source, context).0
}

/// Evaluate an expression and note whether it explicitly calls a status function.
///
/// GitHub Actions adds an implicit `success()` gate to job conditions unless
/// the condition contains a status check function. The planner uses this
/// metadata to model that gate without treating text in a string literal as a
/// status function.
pub(crate) fn evaluate_with_metadata(source: &str, context: &Value) -> (EvalResult, bool) {
    let trimmed = source.trim();
    let expr = trimmed
        .strip_prefix("${{")
        .and_then(|v| v.strip_suffix("}}"))
        .map(str::trim)
        .unwrap_or(trimmed);
    let mut parser = match Parser::new(expr, context) {
        Ok(parser) => parser,
        Err(message) => return (EvalResult::Error { message }, false),
    };
    let parsed = (|| {
        let value = parser.parse_or()?;
        if !matches!(parser.current, Token::End) {
            return Err(format!("unexpected token {}", parser.current.describe()));
        }
        Ok(value)
    })();
    let used_status_function = parser.used_status_function;
    let result = match parsed {
        Ok(EValue::Known(value)) => EvalResult::Known {
            display: display(&value),
            value,
        },
        Ok(EValue::Unknown(reason)) => EvalResult::Unknown { reason },
        Err(message) => EvalResult::Error { message },
    };
    (result, used_status_function)
}

#[derive(Clone, Debug)]
enum EValue {
    Known(Value),
    Unknown(String),
}

impl EValue {
    fn known(value: impl Into<Value>) -> Self {
        Self::Known(value.into())
    }
    fn map_bool(self, f: impl FnOnce(bool) -> bool) -> Self {
        match self {
            Self::Known(v) => Self::known(f(truthy(&v))),
            Self::Unknown(r) => Self::Unknown(r),
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
enum Token {
    Ident(String),
    String(String),
    Number(f64),
    True,
    False,
    Null,
    LParen,
    RParen,
    LBracket,
    RBracket,
    Comma,
    Dot,
    Eq,
    Ne,
    Gt,
    Ge,
    Lt,
    Le,
    And,
    Or,
    Not,
    End,
}

impl Token {
    fn describe(&self) -> String {
        match self {
            Self::Ident(s) => s.clone(),
            Self::String(_) => "string".into(),
            Self::Number(n) => n.to_string(),
            other => format!("{other:?}"),
        }
    }
}

struct Lexer<'a> {
    chars: Vec<char>,
    pos: usize,
    _source: &'a str,
}

impl<'a> Lexer<'a> {
    fn new(source: &'a str) -> Self {
        Self {
            chars: source.chars().collect(),
            pos: 0,
            _source: source,
        }
    }
    fn next(&mut self) -> Result<Token, String> {
        while self.pos < self.chars.len() && self.chars[self.pos].is_whitespace() {
            self.pos += 1;
        }
        if self.pos >= self.chars.len() {
            return Ok(Token::End);
        }
        let c = self.chars[self.pos];
        let pair: String = self.chars[self.pos..self.chars.len().min(self.pos + 2)]
            .iter()
            .collect();
        if let Some(tok) = match pair.as_str() {
            "==" => Some(Token::Eq),
            "!=" => Some(Token::Ne),
            ">=" => Some(Token::Ge),
            "<=" => Some(Token::Le),
            "&&" => Some(Token::And),
            "||" => Some(Token::Or),
            _ => None,
        } {
            self.pos += 2;
            return Ok(tok);
        }
        let single = match c {
            '(' => Some(Token::LParen),
            ')' => Some(Token::RParen),
            '[' => Some(Token::LBracket),
            ']' => Some(Token::RBracket),
            ',' => Some(Token::Comma),
            '.' => Some(Token::Dot),
            '!' => Some(Token::Not),
            '>' => Some(Token::Gt),
            '<' => Some(Token::Lt),
            _ => None,
        };
        if let Some(tok) = single {
            self.pos += 1;
            return Ok(tok);
        }
        if c == '\'' || c == '"' {
            let quote = c;
            self.pos += 1;
            let mut out = String::new();
            while self.pos < self.chars.len() {
                let ch = self.chars[self.pos];
                self.pos += 1;
                if ch == quote {
                    return Ok(Token::String(out));
                }
                if ch == '\\' && self.pos < self.chars.len() {
                    out.push(self.chars[self.pos]);
                    self.pos += 1;
                } else {
                    out.push(ch);
                }
            }
            return Err("unterminated string".into());
        }
        if c.is_ascii_digit()
            || (c == '-'
                && self
                    .chars
                    .get(self.pos + 1)
                    .is_some_and(|v| v.is_ascii_digit()))
        {
            let start = self.pos;
            self.pos += 1;
            while self.pos < self.chars.len()
                && (self.chars[self.pos].is_ascii_digit() || self.chars[self.pos] == '.')
            {
                self.pos += 1;
            }
            let raw: String = self.chars[start..self.pos].iter().collect();
            return raw
                .parse()
                .map(Token::Number)
                .map_err(|_| format!("invalid number {raw}"));
        }
        if c.is_alphanumeric() || c == '_' || c == '*' {
            let start = self.pos;
            self.pos += 1;
            while self.pos < self.chars.len()
                && (self.chars[self.pos].is_alphanumeric()
                    || matches!(self.chars[self.pos], '_' | '-' | '*'))
            {
                self.pos += 1;
            }
            let word: String = self.chars[start..self.pos].iter().collect();
            return Ok(match word.to_ascii_lowercase().as_str() {
                "true" => Token::True,
                "false" => Token::False,
                "null" => Token::Null,
                _ => Token::Ident(word),
            });
        }
        Err(format!("unexpected character '{c}'"))
    }
}

struct Parser<'a> {
    lexer: Lexer<'a>,
    current: Token,
    context: &'a Value,
    used_status_function: bool,
}

impl<'a> Parser<'a> {
    fn new(source: &'a str, context: &'a Value) -> Result<Self, String> {
        let mut lexer = Lexer::new(source);
        let current = lexer.next()?;
        Ok(Self {
            lexer,
            current,
            context,
            used_status_function: false,
        })
    }
    fn bump(&mut self) -> Result<Token, String> {
        let old = self.current.clone();
        self.current = self.lexer.next()?;
        Ok(old)
    }
    fn parse_or(&mut self) -> Result<EValue, String> {
        let mut left = self.parse_and()?;
        while self.current == Token::Or {
            self.bump()?;
            let right = self.parse_and()?;
            left = logical(left, right, true);
        }
        Ok(left)
    }
    fn parse_and(&mut self) -> Result<EValue, String> {
        let mut left = self.parse_compare()?;
        while self.current == Token::And {
            self.bump()?;
            let right = self.parse_compare()?;
            left = logical(left, right, false);
        }
        Ok(left)
    }
    fn parse_compare(&mut self) -> Result<EValue, String> {
        let left = self.parse_unary()?;
        let op = self.current.clone();
        if !matches!(
            op,
            Token::Eq | Token::Ne | Token::Gt | Token::Ge | Token::Lt | Token::Le
        ) {
            return Ok(left);
        }
        self.bump()?;
        let right = self.parse_unary()?;
        Ok(compare(left, right, op))
    }
    fn parse_unary(&mut self) -> Result<EValue, String> {
        if self.current == Token::Not {
            self.bump()?;
            return Ok(self.parse_unary()?.map_bool(|v| !v));
        }
        self.parse_primary()
    }
    fn parse_primary(&mut self) -> Result<EValue, String> {
        match self.bump()? {
            Token::String(s) => Ok(EValue::known(s)),
            Token::Number(n) => Ok(EValue::known(n)),
            Token::True => Ok(EValue::known(true)),
            Token::False => Ok(EValue::known(false)),
            Token::Null => Ok(EValue::Known(Value::Null)),
            Token::LParen => {
                let value = self.parse_or()?;
                if self.bump()? != Token::RParen {
                    return Err("expected ')'".into());
                }
                Ok(value)
            }
            Token::Ident(name) => {
                if self.current == Token::LParen {
                    self.parse_call(&name)
                } else {
                    self.parse_path(name)
                }
            }
            token => Err(format!("expected a value, found {}", token.describe())),
        }
    }
    fn parse_path(&mut self, first: String) -> Result<EValue, String> {
        let mut path = vec![first];
        loop {
            if self.current == Token::Dot {
                self.bump()?;
                match self.bump()? {
                    Token::Ident(s) => path.push(s),
                    other => return Err(format!("expected property, found {}", other.describe())),
                }
            } else if self.current == Token::LBracket {
                self.bump()?;
                match self.bump()? {
                    Token::String(s) | Token::Ident(s) => path.push(s),
                    Token::Number(n) => path.push((n as usize).to_string()),
                    other => return Err(format!("invalid index {}", other.describe())),
                };
                if self.bump()? != Token::RBracket {
                    return Err("expected ']'".into());
                }
            } else {
                break;
            }
        }
        let mut value = self.context.clone();
        for part in &path {
            value = match &value {
                Value::Object(map) => match map.get(part) {
                    Some(v) => v.clone(),
                    None => {
                        return Ok(EValue::Unknown(format!(
                            "{} is not declared in this synthetic event",
                            path.join(".")
                        )))
                    }
                },
                Value::Array(_) if part == "*" => value.clone(),
                Value::Array(items) => {
                    if let Some(item) = part.parse::<usize>().ok().and_then(|i| items.get(i)) {
                        item.clone()
                    } else {
                        let projected: Vec<Value> = items
                            .iter()
                            .filter_map(|item| {
                                item.as_object()
                                    .and_then(|object| object.get(part))
                                    .cloned()
                            })
                            .collect();
                        if projected.is_empty() {
                            return Ok(EValue::Unknown(format!(
                                "{} is unavailable",
                                path.join(".")
                            )));
                        }
                        Value::Array(projected)
                    }
                }
                _ => {
                    return Ok(EValue::Unknown(format!(
                        "{} cannot be resolved",
                        path.join(".")
                    )))
                }
            };
        }
        Ok(EValue::Known(value))
    }
    fn parse_call(&mut self, name: &str) -> Result<EValue, String> {
        if matches!(
            name.to_ascii_lowercase().as_str(),
            "always" | "success" | "failure" | "cancelled"
        ) {
            self.used_status_function = true;
        }
        self.bump()?;
        let mut args = Vec::new();
        if self.current != Token::RParen {
            loop {
                args.push(self.parse_or()?);
                if self.current == Token::Comma {
                    self.bump()?;
                } else {
                    break;
                }
            }
        }
        if self.bump()? != Token::RParen {
            return Err("expected ')' after function arguments".into());
        }
        call(name, args, self.context)
    }
}

fn logical(left: EValue, right: EValue, is_or: bool) -> EValue {
    match (left, right) {
        (EValue::Known(a), EValue::Known(b)) => EValue::known(if is_or {
            truthy(&a) || truthy(&b)
        } else {
            truthy(&a) && truthy(&b)
        }),
        (EValue::Known(v), EValue::Unknown(r)) | (EValue::Unknown(r), EValue::Known(v)) => {
            if (is_or && truthy(&v)) || (!is_or && !truthy(&v)) {
                EValue::known(is_or)
            } else {
                EValue::Unknown(r)
            }
        }
        (EValue::Unknown(a), EValue::Unknown(b)) => EValue::Unknown(format!("{a}; {b}")),
    }
}

fn compare(left: EValue, right: EValue, op: Token) -> EValue {
    let (a, b) = match (left, right) {
        (EValue::Known(a), EValue::Known(b)) => (a, b),
        (EValue::Unknown(r), _) | (_, EValue::Unknown(r)) => return EValue::Unknown(r),
    };
    let eq = equal(&a, &b);
    let ordering = numeric(&a)
        .zip(numeric(&b))
        .and_then(|(x, y)| x.partial_cmp(&y))
        .or_else(|| {
            Some(
                display(&a)
                    .to_ascii_lowercase()
                    .cmp(&display(&b).to_ascii_lowercase()),
            )
        });
    EValue::known(match op {
        Token::Eq => eq,
        Token::Ne => !eq,
        Token::Gt => ordering.is_some_and(|o| o.is_gt()),
        Token::Ge => ordering.is_some_and(|o| o.is_ge()),
        Token::Lt => ordering.is_some_and(|o| o.is_lt()),
        Token::Le => ordering.is_some_and(|o| o.is_le()),
        _ => false,
    })
}

fn call(name: &str, args: Vec<EValue>, context: &Value) -> Result<EValue, String> {
    if let Some(reason) = args.iter().find_map(|a| {
        if let EValue::Unknown(r) = a {
            Some(r.clone())
        } else {
            None
        }
    }) {
        return Ok(EValue::Unknown(reason));
    }
    let values: Vec<Value> = args
        .into_iter()
        .filter_map(|a| {
            if let EValue::Known(v) = a {
                Some(v)
            } else {
                None
            }
        })
        .collect();
    let arg = |i: usize| {
        values
            .get(i)
            .cloned()
            .ok_or_else(|| format!("{name} requires more arguments"))
    };
    match name.to_ascii_lowercase().as_str() {
        "contains" => {
            let hay = arg(0)?;
            let needle = arg(1)?;
            Ok(EValue::known(match hay {
                Value::Array(a) => a.iter().any(|v| equal(v, &needle)),
                _ => display(&hay)
                    .to_ascii_lowercase()
                    .contains(&display(&needle).to_ascii_lowercase()),
            }))
        }
        "startswith" => Ok(EValue::known(
            display(&arg(0)?)
                .to_ascii_lowercase()
                .starts_with(&display(&arg(1)?).to_ascii_lowercase()),
        )),
        "endswith" => Ok(EValue::known(
            display(&arg(0)?)
                .to_ascii_lowercase()
                .ends_with(&display(&arg(1)?).to_ascii_lowercase()),
        )),
        "format" => {
            let mut out = display(&arg(0)?);
            for (i, value) in values.iter().skip(1).enumerate() {
                out = out.replace(&format!("{{{i}}}"), &display(value));
            }
            Ok(EValue::known(out))
        }
        "join" => {
            let sep = values.get(1).map(display).unwrap_or_else(|| ",".into());
            let arr = arg(0)?;
            Ok(EValue::known(
                arr.as_array()
                    .map(|a| a.iter().map(display).collect::<Vec<_>>().join(&sep))
                    .unwrap_or_default(),
            ))
        }
        "tojson" => Ok(EValue::known(
            serde_json::to_string(&arg(0)?).unwrap_or_default(),
        )),
        "fromjson" => serde_json::from_str::<Value>(&display(&arg(0)?))
            .map(EValue::Known)
            .map_err(|e| format!("fromJSON: {e}")),
        "always" => Ok(EValue::known(true)),
        "success" => Ok(EValue::known(status_value(context, "success", true))),
        "failure" => Ok(EValue::known(status_value(context, "failure", false))),
        "cancelled" => Ok(EValue::known(status_value(context, "cancelled", false))),
        "hashfiles" => Ok(EValue::Unknown(
            "hashFiles() requires repository file access and is not evaluated".into(),
        )),
        _ => Ok(EValue::Unknown(format!(
            "function {name}() is not supported"
        ))),
    }
}

fn status_value(context: &Value, name: &str, default: bool) -> bool {
    context
        .get("__ghaplan_status")
        .and_then(Value::as_object)
        .and_then(|status| status.get(name))
        .and_then(Value::as_bool)
        .unwrap_or(default)
}

fn truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(v) => *v,
        Value::Number(n) => n.as_f64().is_some_and(|v| v != 0.0 && !v.is_nan()),
        Value::String(s) => !s.is_empty(),
        _ => true,
    }
}
fn numeric(value: &Value) -> Option<f64> {
    match value {
        Value::Number(n) => n.as_f64(),
        Value::String(s) => s.parse().ok(),
        Value::Bool(v) => Some(if *v { 1.0 } else { 0.0 }),
        Value::Null => Some(0.0),
        _ => None,
    }
}
fn equal(a: &Value, b: &Value) -> bool {
    if let (Some(x), Some(y)) = (numeric(a), numeric(b)) {
        x == y
    } else {
        display(a).eq_ignore_ascii_case(&display(b))
    }
}
fn display(value: &Value) -> String {
    match value {
        Value::Null => String::new(),
        Value::Bool(v) => v.to_string(),
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        other => serde_json::to_string(other).unwrap_or_default(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn evaluates_documented_operators_and_functions() {
        let ctx = json!({"github":{"event_name":"pull_request","ref":"refs/heads/main"},"matrix":{"os":"ubuntu"}});
        assert_eq!(
            evaluate(
                "github.event_name == 'pull_request' && contains(matrix.os, 'UBU')",
                &ctx
            )
            .truthy(),
            Some(true)
        );
        assert_eq!(
            evaluate("!startsWith(github.ref, 'refs/tags/')", &ctx).truthy(),
            Some(true)
        );
    }
    #[test]
    fn declares_unknowns() {
        assert!(matches!(
            evaluate("secrets.TOKEN != ''", &json!({})),
            EvalResult::Unknown { .. }
        ));
    }
    #[test]
    fn supports_object_filter_wildcards() {
        let ctx = json!({"github":{"event":{"pull_request":{"labels":[{"name":"ready"},{"name":"docs"}]}}}});
        assert_eq!(
            evaluate(
                "contains(github.event.pull_request.labels.*.name, 'ready')",
                &ctx
            )
            .truthy(),
            Some(true)
        );
    }
}
