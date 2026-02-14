```
// templates/one_component_skeleton.tmpl
//
// Skeleton for a One* component using tokens.

class OneActionButton extends StatelessWidget {
  const OneActionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = OneButtonVariant.primary,
    this.isLoading = false,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final OneButtonVariant variant;
  final bool isLoading;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final effectiveLabel = semanticLabel ?? label;

    return Semantics(
      button: true,
      label: effectiveLabel,
      child: OneButton(
        label: label,
        onPressed: isLoading ? null : onPressed,
        variant: variant,
        isLoading: isLoading,
      ),
    );
  }
}
```
