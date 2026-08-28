# Demo sandbox

- **Web:** open `/demo` or `/?demo=1`. It immediately renders the included
  pull request workflow and its job, matrix-cell, and step decisions. The
  result appears above the editable event and workflow fields.
- **CLI:** run `ghaplan demo` or `ghaplan --demo`. It writes the included
  workflow to a temporary `ghaplan-demo-<pid>` directory and prints its plan.
- **Sample:** `examples/pull-request.yml` uses a pull request to `main`, two
  source paths, a three-cell matrix, a dependent preview job, and a referenced
  secret whose value remains unknown.
- **Isolation:** browser demo edits use only the `demo:workflow-source`
  localStorage key. Real planning does not read or write localStorage.
- **Reset:** **Reset demo** removes every `demo:` key and restores the shipped
  sample. **Plan my workflow** leaves the sandbox; the next real plan starts from
  the shipped editor example.
