# Team Member Permissions API Documentation

This document provides detailed information on how frontend applications can consume the Team Member Permissions API endpoints. These endpoints allow for viewing, updating, and resetting custom permissions for team members.

## Authentication

All API endpoints require authentication using Laravel Sanctum. Include the authentication token in the request headers:

```
Authorization: Bearer {your_auth_token}
```

## Base URL

All endpoints are prefixed with `/api`.

## Available Endpoints

### 1. Get Team Member Permissions

Retrieves the permissions for a specific team member.

**URL:** `GET /api/teams/{teamId}/members/{userId}/permissions`

**URL Parameters:**
- `teamId` (UUID): ID of the team
- `userId` (UUID): ID of the user to get permissions for

**Sample Response (200 OK):**
```json
{
  "data": {
    "user_id": "9f28a2ed-5a8c-4a4f-be6c-a60e93ad2c2e",
    "team_id": "7b4e9a5d-8c6b-4f7a-9e3d-2c1b4a5d6e8f",
    "role": "Team Member",
    "permissions": [
      "team.activity.view",
      "team.analytics.view",
      "team.data.export"
    ],
    "available_permissions": [
      "team.member.manage",
      "team.member.invite",
      "team.activity.view",
      "team.activity.manage",
      "team.analytics.view",
      "team.data.export"
    ],
    "default_permissions": [
      "team.activity.view",
      "team.analytics.view"
    ],
    "has_custom_permissions": true
  }
}
```

**Error Responses:**
- `403 Forbidden`: User does not have permission to view team member permissions
- `404 Not Found`: Team or user not found, or user is not a member of the team

### 2. Update Team Member Permissions

Updates the permissions for a specific team member.

**URL:** `PUT /api/teams/{teamId}/members/{userId}/permissions`

**URL Parameters:**
- `teamId` (UUID): ID of the team
- `userId` (UUID): ID of the user to update permissions for

**Request Body:**
```json
{
  "permissions": [
    "team.activity.view",
    "team.analytics.view",
    "team.data.export"
  ]
}
```

**Notes:**
- Only include permissions from the available permissions list
- All permissions must be valid, as defined in `TeamPermissionService`

**Sample Response (200 OK):**
```json
{
  "message": "Permissions updated successfully",
  "data": {
    "user_id": "9f28a2ed-5a8c-4a4f-be6c-a60e93ad2c2e",
    "team_id": "7b4e9a5d-8c6b-4f7a-9e3d-2c1b4a5d6e8f",
    "permissions": [
      "team.activity.view",
      "team.analytics.view",
      "team.data.export"
    ]
  }
}
```

**Error Responses:**
- `403 Forbidden`: User does not have permission to update team member permissions
- `404 Not Found`: Team or user not found, or user is not a member of the team
- `422 Unprocessable Entity`: Invalid permissions or cannot modify owner permissions

### 3. Reset Team Member Permissions

Resets the permissions for a specific team member to the default permissions for their role.

**URL:** `DELETE /api/teams/{teamId}/members/{userId}/permissions`

**URL Parameters:**
- `teamId` (UUID): ID of the team
- `userId` (UUID): ID of the user to reset permissions for

**Sample Response (200 OK):**
```json
{
  "message": "Permissions reset to default",
  "data": {
    "user_id": "9f28a2ed-5a8c-4a4f-be6c-a60e93ad2c2e",
    "team_id": "7b4e9a5d-8c6b-4f7a-9e3d-2c1b4a5d6e8f",
    "role": "Team Member",
    "permissions": [
      "team.activity.view",
      "team.analytics.view"
    ]
  }
}
```

**Error Responses:**
- `403 Forbidden`: User does not have permission to reset team member permissions
- `404 Not Found`: Team or user not found, or user is not a member of the team
- `422 Unprocessable Entity`: Cannot reset owner permissions

## Available Permissions

The following permissions are available for team members:

| Permission Key | Description |
|----------------|-------------|
| `team.member.manage` | Ability to add, remove, and update team members |
| `team.member.invite` | Ability to invite new members to the team |
| `team.activity.view` | Ability to see team activities |
| `team.activity.manage` | Ability to create and modify team activities |
| `team.analytics.view` | Ability to view team performance metrics |
| `team.data.export` | Ability to export team data |

## Default Role Permissions

Each role comes with default permissions:

### Team Leader
- All permissions

### Team Member
- `team.activity.view`
- `team.analytics.view`

## Frontend Implementation Examples

### Vue.js Example (with Axios)

```javascript
// Get team member permissions
async function getTeamMemberPermissions(teamId, userId) {
  try {
    const response = await axios.get(`/api/teams/${teamId}/members/${userId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

// Update team member permissions
async function updateTeamMemberPermissions(teamId, userId, permissions) {
  try {
    const response = await axios.put(
      `/api/teams/${teamId}/members/${userId}/permissions`,
      { permissions },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

// Reset team member permissions
async function resetTeamMemberPermissions(teamId, userId) {
  try {
    const response = await axios.delete(`/api/teams/${teamId}/members/${userId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}

// Error handling function
function handleError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Server error:', error.response.data);
    if (error.response.status === 403) {
      // Handle unauthorized access
    } else if (error.response.status === 404) {
      // Handle not found errors
    } else if (error.response.status === 422) {
      // Handle validation errors
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Network error:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Request error:', error.message);
  }
}
```

### React Example (with fetch)

```jsx
// Get team member permissions
const getTeamMemberPermissions = async (teamId, userId) => {
  try {
    const response = await fetch(`/api/teams/${teamId}/members/${userId}/permissions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    return await response.json();
  } catch (error) {
    handleError(error);
  }
};

// Update team member permissions
const updateTeamMemberPermissions = async (teamId, userId, permissions) => {
  try {
    const response = await fetch(`/api/teams/${teamId}/members/${userId}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ permissions })
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    return await response.json();
  } catch (error) {
    handleError(error);
  }
};

// Reset team member permissions
const resetTeamMemberPermissions = async (teamId, userId) => {
  try {
    const response = await fetch(`/api/teams/${teamId}/members/${userId}/permissions`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw await response.json();
    }
    
    return await response.json();
  } catch (error) {
    handleError(error);
  }
};

// Error handling function
const handleError = (error) => {
  console.error('API Error:', error);
  // Handle specific error types based on status code or message
};
```

## UI Implementation Considerations

When implementing the UI for managing team member permissions, consider these best practices:

1. **Permission Selection UI**: Use checkboxes for each available permission
2. **Group Permissions**: Group related permissions together (as in the Permission Groups)
3. **Default vs Custom**: Clearly indicate which permissions are default for the role and which are custom
4. **Reset Option**: Provide a clear way to reset permissions to defaults
5. **Validation**: Validate permissions client-side before sending to API
6. **Role-Based Conditionals**: Only show permission management UI to users with appropriate permissions
7. **Loading States**: Show loading states during API requests
8. **Error Handling**: Display meaningful error messages for API failures

## User Experience Recommendations

1. Consider implementing a permission explanation tooltip for each permission
2. Use a confirmation dialog before resetting permissions
3. Show a success notification after permissions are updated or reset
4. Provide a visual indication of which permissions have been changed from the defaults
5. Consider implementing "select all" and "clear all" options for permissions 