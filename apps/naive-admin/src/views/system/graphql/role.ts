import { gql } from '@apollo/client/core';

export const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
      description
      permissions {
        id
        name
        resource
        action
        description
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ROLE = gql`
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
      description
      permissions {
        id
        name
        resource
        action
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ROLE = gql`
  mutation UpdateRole($input: UpdateRoleInput!) {
    updateRole(input: $input) {
      id
      name
      description
      updatedAt
    }
  }
`;

export const DELETE_ROLE = gql`
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`;

export const ADD_PERMISSIONS_TO_ROLE = gql`
  mutation AddPermissionsToRole($roleId: ID!, $permissionIds: [ID!]!) {
    addPermissionsToRole(roleId: $roleId, permissionIds: $permissionIds) {
      id
      permissions {
        id
        name
        resource
        action
      }
    }
  }
`;

export const REMOVE_PERMISSIONS_FROM_ROLE = gql`
  mutation RemovePermissionsFromRole($roleId: ID!, $permissionIds: [ID!]!) {
    removePermissionsFromRole(roleId: $roleId, permissionIds: $permissionIds) {
      id
      permissions {
        id
        name
        resource
        action
      }
    }
  }
`; 