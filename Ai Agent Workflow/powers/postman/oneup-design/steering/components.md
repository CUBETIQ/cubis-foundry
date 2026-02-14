# Component Mapping

## Flutter → One* Components

| Flutter Widget | One* Component |
|----------------|----------------|
| ElevatedButton | OneButton |
| TextButton | OneButton.text |
| OutlinedButton | OneButton.outlined |
| TextField | OneTextField |
| Card | OneCard |
| Text | OneText |
| CircularProgressIndicator | OneLoading |
| Checkbox | OneCheckbox |
| Switch | OneSwitch |
| Radio | OneRadio |
| Slider | OneSlider |
| BottomSheet | OneBottomSheet |
| Dialog | OneDialog |
| SnackBar | OneSnackBar |
| AppBar | OneAppBar |
| Chip | OneChip |
| Badge | OneBadge |
| Avatar | OneAvatar |
| Divider | OneDivider |

## Usage Examples

```dart
// ❌ Don't use
ElevatedButton(
  onPressed: () {},
  child: Text('Submit'),
)

// ✅ Use instead
OneButton(
  onPressed: () {},
  label: 'Submit',
)
```

```dart
// ❌ Don't use
TextField(
  decoration: InputDecoration(labelText: 'Email'),
)

// ✅ Use instead
OneTextField(
  label: 'Email',
)
```
