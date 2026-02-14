# Example: Attendance list with paging + refresh (realistic)

This example shows how to implement:
- initial load (today’s attendance)
- pull-to-refresh
- infinite scroll “load more” (older records)
- cached-first UX

## Files
- `features/attendance/attendance_controller.dart`
- `features/attendance/attendance_state.dart`
- `features/attendance/views/attendance_view.dart`

## State (simplified)
Use `PagedState<AttendanceRecord>` from the template.

## Controller
Use `PagedItemsController` template but rename:
- `PagedAttendanceController`
- `AttendanceRepository.fetchAttendancePage(...)`

## UI
- The screen watches the controller provider.
- A `ScrollController` triggers `loadNextPage` when close to bottom.
- `RefreshIndicator` calls `refresh()`.

Important minimal-rebuild tip:
- The list widget should be a separate widget that receives `items` as plain values.
- Only one place watches the provider.
