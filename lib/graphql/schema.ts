/**
 * GraphQL Schema
 * 
 * GraphQL schema for PayAid V3 API
 * Provides flexible querying for complex dashboards and mobile apps
 */

import { buildSchema } from 'graphql'

export const schema = buildSchema(`
  scalar DateTime
  scalar JSON

  type Query {
    # Contact queries
    contacts(tenantId: String!, limit: Int, offset: Int, status: String): [Contact!]!
    contact(id: String!, tenantId: String!): Contact
    
    # Deal queries
    deals(tenantId: String!, limit: Int, offset: Int, stage: String): [Deal!]!
    deal(id: String!, tenantId: String!): Deal
    
    # Task queries
    tasks(tenantId: String!, limit: Int, offset: Int, status: String): [Task!]!
    task(id: String!, tenantId: String!): Task
    
    # Invoice queries
    invoices(tenantId: String!, limit: Int, offset: Int, status: String): [Invoice!]!
    invoice(id: String!, tenantId: String!): Invoice
    
    # Order queries
    orders(tenantId: String!, limit: Int, offset: Int, status: String): [Order!]!
    order(id: String!, tenantId: String!): Order
    
    # Dashboard query (complex query for dashboards)
    dashboard(tenantId: String!): Dashboard!
  }

  type Contact {
    id: String!
    name: String
    email: String
    phone: String
    type: String
    status: String
    company: String
    notes: String
    createdAt: String!
    updatedAt: String!
    deals: [Deal!]!
    invoices: [Invoice!]!
    orders: [Order!]!
    tasks: [Task!]!
  }

  type Deal {
    id: String!
    name: String!
    value: Float
    stage: String!
    probability: Float
    expectedCloseDate: String
    createdAt: String!
    updatedAt: String!
    contact: Contact
    contactId: String
    tasks: [Task!]!
  }

  type Task {
    id: String!
    title: String!
    description: String
    status: String!
    priority: String
    dueDate: String
    completedAt: String
    createdAt: String!
    updatedAt: String!
    contact: Contact
    contactId: String
    deal: Deal
    dealId: String
  }

  type Invoice {
    id: String!
    invoiceNumber: String!
    total: Float!
    status: String!
    dueDate: String
    paidAt: String
    createdAt: String!
    updatedAt: String!
    contact: Contact
    customerId: String
  }

  type Order {
    id: String!
    orderNumber: String!
    total: Float!
    status: String!
    createdAt: String!
    updatedAt: String!
    contact: Contact
    customerId: String
  }

  type Dashboard {
    contacts: ContactStats!
    deals: DealStats!
    tasks: TaskStats!
    invoices: InvoiceStats!
    orders: OrderStats!
  }

  type ContactStats {
    total: Int!
    byStatus: [StatusCount!]!
    recent: [Contact!]!
  }

  type DealStats {
    total: Int!
    totalValue: Float!
    byStage: [StageCount!]!
    recent: [Deal!]!
  }

  type TaskStats {
    total: Int!
    byStatus: [StatusCount!]!
    overdue: Int!
    recent: [Task!]!
  }

  type InvoiceStats {
    total: Int!
    totalAmount: Float!
    byStatus: [StatusCount!]!
    overdue: Int!
    recent: [Invoice!]!
  }

  type OrderStats {
    total: Int!
    totalValue: Float!
    byStatus: [StatusCount!]!
    recent: [Order!]!
  }

  type StatusCount {
    status: String!
    count: Int!
  }

  type StageCount {
    stage: String!
    count: Int!
    totalValue: Float!
  }

  type Mutation {
    # Contact mutations
    createContact(tenantId: String!, input: ContactInput!): Contact!
    updateContact(id: String!, tenantId: String!, input: ContactInput!): Contact!
    deleteContact(id: String!, tenantId: String!): Boolean!
    
    # Deal mutations
    createDeal(tenantId: String!, input: DealInput!): Deal!
    updateDeal(id: String!, tenantId: String!, input: DealInput!): Deal!
    deleteDeal(id: String!, tenantId: String!): Boolean!
    
    # Task mutations
    createTask(tenantId: String!, input: TaskInput!): Task!
    updateTask(id: String!, tenantId: String!, input: TaskInput!): Task!
    deleteTask(id: String!, tenantId: String!): Boolean!
  }

  input ContactInput {
    name: String
    email: String
    phone: String
    type: String
    status: String
    company: String
    notes: String
  }

  input DealInput {
    name: String!
    value: Float
    stage: String!
    probability: Float
    expectedCloseDate: String
    contactId: String
  }

  input TaskInput {
    title: String!
    description: String
    status: String!
    priority: String
    dueDate: String
    contactId: String
    dealId: String
  }
`)
