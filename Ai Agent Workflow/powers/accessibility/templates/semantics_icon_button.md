```
// templates/semantics_icon_button.tmpl
//
// Wrap icon-only buttons with Semantics + Tooltip.

Widget a11yIconButton({
  required String label,
  required VoidCallback onPressed,
  required IconData icon,
}) {
  return Semantics(
    button: true,
    label: label,
    child: Tooltip(
      message: label,
      child: IconButton(
        onPressed: onPressed,
        icon: Icon(icon),
      ),
    ),
  );
}
```
