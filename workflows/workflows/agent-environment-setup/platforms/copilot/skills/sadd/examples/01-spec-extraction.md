# Example: Extract Specifications from a Feature Requirements Document

## Scenario

A product manager wrote a feature requirements document for a file upload feature. The development team needs to extract testable specifications before implementation begins.

## User Prompt

> Extract testable specifications from this feature requirement:
>
> ## File Upload Feature
> Users should be able to upload files to their project workspace. Supported formats are PDF, PNG, JPG, and SVG. Maximum file size is 10MB. Files are stored in S3 with a unique key. Uploaded files appear in the file list immediately. Users can delete their own files but not files uploaded by others. Administrators can delete any file. File names are sanitized to remove special characters.

## Expected Response

### Specification Registry

| ID       | Classification | Specification |
|----------|---------------|---------------|
| SPEC-001 | Functional    | GIVEN a logged-in user WHEN they upload a PDF, PNG, JPG, or SVG file under 10MB THEN the file is stored successfully and a confirmation is returned. |
| SPEC-002 | Constraint    | GIVEN a user attempting to upload WHEN the file format is not PDF, PNG, JPG, or SVG THEN the upload is rejected with a descriptive error message. |
| SPEC-003 | Constraint    | GIVEN a user attempting to upload WHEN the file size exceeds 10MB THEN the upload is rejected with a file-too-large error. |
| SPEC-004 | Functional    | GIVEN a successful upload WHEN the file is stored THEN it is placed in S3 with a unique key that prevents collisions. |
| SPEC-005 | Functional    | GIVEN a successful upload WHEN the user views the file list THEN the newly uploaded file appears without requiring a page refresh. |
| SPEC-006 | Security      | GIVEN a non-admin user WHEN they attempt to delete a file uploaded by another user THEN the deletion is denied with a 403 status. |
| SPEC-007 | Security      | GIVEN an admin user WHEN they attempt to delete any file THEN the deletion succeeds regardless of who uploaded it. |
| SPEC-008 | Functional    | GIVEN a user who uploaded a file WHEN they delete it THEN the file is removed from both S3 and the file list. |
| SPEC-009 | Functional    | GIVEN a file with special characters in its name WHEN it is uploaded THEN the file name is sanitized to contain only alphanumeric characters, hyphens, underscores, and the original extension. |

### Gap Analysis

| Issue | Requirement Text | Question |
|-------|-----------------|----------|
| Ambiguous | "appear immediately" | Does "immediately" mean optimistic UI update, or server-confirmed? What is the acceptable latency? |
| Missing | File name sanitization | What happens if two files have the same name after sanitization? Is a suffix added? |
| Missing | Upload limits | Is there a limit on the number of files per project or per user? |
| Missing | Concurrent uploads | Can multiple users upload to the same project simultaneously? |
| Missing | File replacement | Can a user upload a file with the same name as an existing file? Does it overwrite or create a new version? |

### Test Plan (Skeletons)

```javascript
describe('File Upload', () => {
  test('SPEC-001: accepts valid file formats under size limit', async () => {
    // Arrange: create a 5MB PDF file
    // Act: POST /api/files with the file
    // Assert: 201 status, file ID returned, file exists in S3
  });

  test('SPEC-002: rejects unsupported file formats', async () => {
    // Arrange: create a .exe file
    // Act: POST /api/files with the file
    // Assert: 400 status, error message mentions supported formats
  });

  test('SPEC-003: rejects files exceeding size limit', async () => {
    // Arrange: create an 11MB PNG file
    // Act: POST /api/files with the file
    // Assert: 413 status, error message mentions 10MB limit
  });

  test('SPEC-006: prevents non-owner from deleting files', async () => {
    // Arrange: user A uploads a file, authenticate as user B
    // Act: DELETE /api/files/:id as user B
    // Assert: 403 status, file still exists
  });

  test('SPEC-007: allows admin to delete any file', async () => {
    // Arrange: user A uploads a file, authenticate as admin
    // Act: DELETE /api/files/:id as admin
    // Assert: 200 status, file removed from S3 and database
  });
});
```

### Traceability Matrix

| Requirement | Spec IDs | Test IDs | Module |
|-------------|----------|----------|--------|
| Format validation | SPEC-001, SPEC-002 | TEST-001, TEST-002 | upload-service |
| Size limit | SPEC-003 | TEST-003 | upload-service |
| S3 storage | SPEC-004 | TEST-004 | storage-adapter |
| Real-time display | SPEC-005 | TEST-005 | file-list-component |
| Delete authorization | SPEC-006, SPEC-007, SPEC-008 | TEST-006, TEST-007, TEST-008 | file-service |
| Name sanitization | SPEC-009 | TEST-009 | upload-service |

## Why This Response Works

- Extracts 9 specifications from 8 sentences of requirements, showing that each sentence may contain multiple testable conditions.
- Identifies 5 specification gaps that would have been discovered only during implementation without SADD.
- Provides test skeletons that can be implemented immediately without further spec interpretation.
- The traceability matrix enables impact analysis when requirements change.
