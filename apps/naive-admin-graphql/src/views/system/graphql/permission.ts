import { gql } from '@apollo/client/core';

export const GET_HEALTH = gql`
  query GetHealth {
    health
  }
`;

export const GET_PERMISSIONS = gql`
  query GetPermissions {
    permissions {
      id
      name
      resource
      action
      description
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_PERMISSION = gql`
  mutation CreatePermission($input: CreatePermissionInput!) {
    createPermission(input: $input) {
      id
      name
      resource
      action
      description
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PERMISSION = gql`
  mutation UpdatePermission($input: UpdatePermissionInput!) {
    updatePermission(input: $input) {
      id
      name
      resource
      action
      description
      updatedAt
    }
  }
`;

export const DELETE_PERMISSION = gql`
  mutation DeletePermission($id: ID!) {
    deletePermission(id: $id)
  }
`; 