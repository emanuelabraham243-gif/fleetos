export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at: string
          description: string
          driver_id: string | null
          id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          organization_id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          triggered_at: string
          vehicle_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          description: string
          driver_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          organization_id: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          triggered_at?: string
          vehicle_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: Database["public"]["Enums"]["alert_type"]
          created_at?: string
          description?: string
          driver_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          organization_id?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          triggered_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_url: string
          id: string
          mime_type: string | null
          organization_id: string
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_url: string
          id?: string
          mime_type?: string | null
          organization_id: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          organization_id?: string
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_value: Json | null
          organization_id: string
          previous_value: Json | null
          reason: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          organization_id: string
          previous_value?: Json | null
          reason?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_value?: Json | null
          organization_id?: string
          previous_value?: Json | null
          reason?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived_at: string | null
          billing_address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          billing_address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          billing_address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string
          file_url: string
          id: string
          organization_id: string
          title: string
          uploaded_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_url: string
          id?: string
          organization_id: string
          title: string
          uploaded_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_url?: string
          id?: string
          organization_id?: string
          title?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          contract_number: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          organization_id: string
          rate_amount: number | null
          rate_type: Database["public"]["Enums"]["contract_rate_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          contract_number: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          rate_amount?: number | null
          rate_type?: Database["public"]["Enums"]["contract_rate_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          contract_number?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          rate_amount?: number | null
          rate_type?: Database["public"]["Enums"]["contract_rate_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          arrived_at: string | null
          client_id: string | null
          confirmed_by: string | null
          created_at: string
          delivered_at: string | null
          delivered_quantity: number | null
          delivery_number: string | null
          description: string | null
          expected_quantity: number | null
          id: string
          notes: string | null
          organization_id: string
          proof_of_delivery_url: string | null
          quantity_unit: string | null
          recipient_name: string | null
          reference_number: string | null
          refusal_reason: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          trip_id: string | null
          trip_stop_id: string | null
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          client_id?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_quantity?: number | null
          delivery_number?: string | null
          description?: string | null
          expected_quantity?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          proof_of_delivery_url?: string | null
          quantity_unit?: string | null
          recipient_name?: string | null
          reference_number?: string | null
          refusal_reason?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          trip_id?: string | null
          trip_stop_id?: string | null
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          client_id?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivered_at?: string | null
          delivered_quantity?: number | null
          delivery_number?: string | null
          description?: string | null
          expected_quantity?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          proof_of_delivery_url?: string | null
          quantity_unit?: string | null
          recipient_name?: string | null
          reference_number?: string | null
          refusal_reason?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          trip_id?: string | null
          trip_stop_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_trip_stop_id_fkey"
            columns: ["trip_stop_id"]
            isOneToOne: false
            referencedRelation: "trip_stops"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          delivery_id: string | null
          description: string
          dispute_type: Database["public"]["Enums"]["dispute_type"]
          driver_id: string | null
          driver_response: string | null
          id: string
          incident_id: string | null
          opened_at: string
          organization_id: string
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          trip_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_id?: string | null
          description: string
          dispute_type?: Database["public"]["Enums"]["dispute_type"]
          driver_id?: string | null
          driver_response?: string | null
          id?: string
          incident_id?: string | null
          opened_at?: string
          organization_id: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_id?: string | null
          description?: string
          dispute_type?: Database["public"]["Enums"]["dispute_type"]
          driver_id?: string | null
          driver_response?: string | null
          id?: string
          incident_id?: string | null
          opened_at?: string
          organization_id?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type_driver"]
          driver_id: string
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string | null
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: Database["public"]["Enums"]["document_type_driver"]
          driver_id: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type_driver"]
          driver_id?: string
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          archived_at: string | null
          created_at: string
          email: string | null
          employee_id: string | null
          full_name: string
          hire_date: string | null
          id: string
          license_class: string | null
          license_expiry: string | null
          license_issued_at: string | null
          license_number: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["driver_status"]
          termination_date: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          license_class?: string | null
          license_expiry?: string | null
          license_issued_at?: string | null
          license_number?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          termination_date?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          employee_id?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          license_class?: string | null
          license_expiry?: string | null
          license_issued_at?: string | null
          license_number?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          termination_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          driver_id: string | null
          id: string
          occurred_at: string
          organization_id: string
          receipt_url: string | null
          status: Database["public"]["Enums"]["record_state"]
          updated_at: string
          vehicle_id: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          driver_id?: string | null
          id?: string
          occurred_at: string
          organization_id: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["record_state"]
          updated_at?: string
          vehicle_id?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          driver_id?: string | null
          id?: string
          occurred_at?: string
          organization_id?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["record_state"]
          updated_at?: string
          vehicle_id?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          driver_id: string | null
          id: string
          notes: string | null
          occurred_at: string
          odometer_km: number | null
          organization_id: string
          price_per_liter: number | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["record_state"]
          total_amount: number
          updated_at: string
          vehicle_id: string
          vendor_name: string | null
          volume_liters: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          occurred_at: string
          odometer_km?: number | null
          organization_id: string
          price_per_liter?: number | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["record_state"]
          total_amount: number
          updated_at?: string
          vehicle_id: string
          vendor_name?: string | null
          volume_liters: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          driver_id?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          odometer_km?: number | null
          organization_id?: string
          price_per_liter?: number | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["record_state"]
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
          vendor_name?: string | null
          volume_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "fuel_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_transactions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_connections: {
        Row: {
          config: Json
          created_at: string
          gps_provider_id: string
          id: string
          last_synced_at: string | null
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["gps_connection_status"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          gps_provider_id: string
          id?: string
          last_synced_at?: string | null
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["gps_connection_status"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          gps_provider_id?: string
          id?: string
          last_synced_at?: string | null
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["gps_connection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_connections_gps_provider_id_fkey"
            columns: ["gps_provider_id"]
            isOneToOne: false
            referencedRelation: "gps_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_events: {
        Row: {
          created_at: string
          heading_degrees: number | null
          id: string
          ignition_on: boolean | null
          latitude: number
          longitude: number
          movement_state: Database["public"]["Enums"]["movement_state"]
          odometer_km: number | null
          organization_id: string
          raw_payload: Json | null
          received_at: string
          recorded_at: string
          speed_kph: number | null
          vehicle_device_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          heading_degrees?: number | null
          id?: string
          ignition_on?: boolean | null
          latitude: number
          longitude: number
          movement_state?: Database["public"]["Enums"]["movement_state"]
          odometer_km?: number | null
          organization_id: string
          raw_payload?: Json | null
          received_at?: string
          recorded_at: string
          speed_kph?: number | null
          vehicle_device_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          heading_degrees?: number | null
          id?: string
          ignition_on?: boolean | null
          latitude?: number
          longitude?: number
          movement_state?: Database["public"]["Enums"]["movement_state"]
          odometer_km?: number | null
          organization_id?: string
          raw_payload?: Json | null
          received_at?: string
          recorded_at?: string
          speed_kph?: number | null
          vehicle_device_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gps_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_events_vehicle_device_id_fkey"
            columns: ["vehicle_device_id"]
            isOneToOne: false
            referencedRelation: "vehicle_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gps_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_providers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          integration_type: Database["public"]["Enums"]["gps_integration_type"]
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          integration_type: Database["public"]["Enums"]["gps_integration_type"]
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          integration_type?: Database["public"]["Enums"]["gps_integration_type"]
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      incident_evidence: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          file_url: string | null
          id: string
          incident_id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          organization_id: string
          recorded_at: string
          source: Database["public"]["Enums"]["evidence_source"]
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          incident_id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          organization_id: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["evidence_source"]
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          file_url?: string | null
          id?: string
          incident_id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          organization_id?: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["evidence_source"]
        }
        Relationships: [
          {
            foreignKeyName: "incident_evidence_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_evidence_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          driver_id: string | null
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          location: string | null
          occurred_at: string
          organization_id: string
          reported_at: string
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          trip_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          driver_id?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          location?: string | null
          occurred_at: string
          organization_id: string
          reported_at?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          driver_id?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          location?: string | null
          occurred_at?: string
          organization_id?: string
          reported_at?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string
          driver_id: string | null
          findings: string | null
          id: string
          inspection_type: Database["public"]["Enums"]["inspection_type"]
          odometer_km: number | null
          organization_id: string
          passed: boolean
          performed_at: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          findings?: string | null
          id?: string
          inspection_type?: Database["public"]["Enums"]["inspection_type"]
          odometer_km?: number | null
          organization_id: string
          passed?: boolean
          performed_at?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          findings?: string | null
          id?: string
          inspection_type?: Database["public"]["Enums"]["inspection_type"]
          odometer_km?: number | null
          organization_id?: string
          passed?: boolean
          performed_at?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_amount?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_issues: {
        Row: {
          created_at: string
          description: string | null
          id: string
          organization_id: string
          reported_at: string
          reported_by: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["maintenance_issue_severity"]
          source: Database["public"]["Enums"]["maintenance_issue_source"]
          status: Database["public"]["Enums"]["maintenance_issue_status"]
          title: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          reported_at?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["maintenance_issue_severity"]
          source?: Database["public"]["Enums"]["maintenance_issue_source"]
          status?: Database["public"]["Enums"]["maintenance_issue_status"]
          title: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          reported_at?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["maintenance_issue_severity"]
          source?: Database["public"]["Enums"]["maintenance_issue_source"]
          status?: Database["public"]["Enums"]["maintenance_issue_status"]
          title?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_issues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_issues_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_issues_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_parts: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          part_name: string
          part_number: string | null
          quantity: number
          total_cost: number | null
          unit_cost: number
          work_order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          part_name: string
          part_number?: string | null
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
          work_order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          part_name?: string
          part_number?: string | null
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_parts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          created_at: string
          id: string
          interval_days: number | null
          interval_km: number | null
          is_active: boolean
          last_done_at: string | null
          last_done_odometer_km: number | null
          next_due_at: string | null
          next_due_odometer_km: number | null
          notes: string | null
          organization_id: string
          title: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interval_days?: number | null
          interval_km?: number | null
          is_active?: boolean
          last_done_at?: string | null
          last_done_odometer_km?: number | null
          next_due_at?: string | null
          next_due_odometer_km?: number | null
          notes?: string | null
          organization_id: string
          title: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_days?: number | null
          interval_km?: number | null
          is_active?: boolean
          last_done_at?: string | null
          last_done_odometer_km?: number | null
          next_due_at?: string | null
          next_due_odometer_km?: number | null
          notes?: string | null
          organization_id?: string
          title?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          organization_id: string
          profile_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          organization_id: string
          profile_id: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          organization_id?: string
          profile_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organization_id: string
          paid_at: string
          reference: string | null
          status: Database["public"]["Enums"]["record_state"]
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id: string
          paid_at?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["record_state"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organization_id?: string
          paid_at?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["record_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deactivated_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string
          phone: string | null
          role: Database["public"]["Enums"]["org_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          email: string
          full_name: string
          id: string
          organization_id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deactivated_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          amount: number
          client_id: string | null
          contract_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          occurred_at: string
          organization_id: string
          status: Database["public"]["Enums"]["record_state"]
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          occurred_at: string
          organization_id: string
          status?: Database["public"]["Enums"]["record_state"]
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          occurred_at?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["record_state"]
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_stops: {
        Row: {
          arrived_at: string | null
          created_at: string
          departed_at: string | null
          id: string
          location: string
          notes: string | null
          organization_id: string
          scheduled_at: string | null
          sequence: number
          status: Database["public"]["Enums"]["trip_stop_status"]
          stop_type: Database["public"]["Enums"]["trip_stop_type"]
          trip_id: string
          updated_at: string
        }
        Insert: {
          arrived_at?: string | null
          created_at?: string
          departed_at?: string | null
          id?: string
          location: string
          notes?: string | null
          organization_id: string
          scheduled_at?: string | null
          sequence: number
          status?: Database["public"]["Enums"]["trip_stop_status"]
          stop_type?: Database["public"]["Enums"]["trip_stop_type"]
          trip_id: string
          updated_at?: string
        }
        Update: {
          arrived_at?: string | null
          created_at?: string
          departed_at?: string | null
          id?: string
          location?: string
          notes?: string | null
          organization_id?: string
          scheduled_at?: string | null
          sequence?: number
          status?: Database["public"]["Enums"]["trip_stop_status"]
          stop_type?: Database["public"]["Enums"]["trip_stop_type"]
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_stops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_stops_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          cargo_description: string | null
          cargo_quantity: number | null
          cargo_quantity_unit: string | null
          cargo_weight_kg: number | null
          client_id: string | null
          contract_id: string | null
          created_at: string
          customer_notes: string | null
          destination: string | null
          distance_km: number | null
          driver_id: string | null
          id: string
          notes: string | null
          organization_id: string
          origin: string | null
          reference_number: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["trip_status"]
          trip_number: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          cargo_description?: string | null
          cargo_quantity?: number | null
          cargo_quantity_unit?: string | null
          cargo_weight_kg?: number | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          customer_notes?: string | null
          destination?: string | null
          distance_km?: number | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          origin?: string | null
          reference_number?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          trip_number: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          cargo_description?: string | null
          cargo_quantity?: number | null
          cargo_quantity_unit?: string | null
          cargo_weight_kg?: number | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          customer_notes?: string | null
          destination?: string | null
          distance_km?: number | null
          driver_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          origin?: string | null
          reference_number?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          trip_number?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_devices: {
        Row: {
          created_at: string
          external_device_id: string
          gps_connection_id: string
          id: string
          installed_at: string
          is_active: boolean
          organization_id: string
          removed_at: string | null
          serial_number: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          external_device_id: string
          gps_connection_id: string
          id?: string
          installed_at?: string
          is_active?: boolean
          organization_id: string
          removed_at?: string | null
          serial_number?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          external_device_id?: string
          gps_connection_id?: string
          id?: string
          installed_at?: string
          is_active?: boolean
          organization_id?: string
          removed_at?: string | null
          serial_number?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_devices_gps_connection_id_fkey"
            columns: ["gps_connection_id"]
            isOneToOne: false
            referencedRelation: "gps_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_devices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_devices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type_vehicle"]
          expires_at: string | null
          file_url: string | null
          id: string
          issued_at: string | null
          notes: string | null
          organization_id: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: Database["public"]["Enums"]["document_type_vehicle"]
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type_vehicle"]
          expires_at?: string | null
          file_url?: string | null
          id?: string
          issued_at?: string | null
          notes?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_driver_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          driver_id: string
          id: string
          organization_id: string
          unassigned_at: string | null
          vehicle_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          driver_id: string
          id?: string
          organization_id: string
          unassigned_at?: string | null
          vehicle_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          organization_id?: string
          unassigned_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_driver_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_driver_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_driver_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_driver_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_locations: {
        Row: {
          gps_event_id: string
          heading_degrees: number | null
          ignition_on: boolean | null
          latitude: number
          longitude: number
          movement_state: Database["public"]["Enums"]["movement_state"]
          odometer_km: number | null
          organization_id: string
          recorded_at: string
          speed_kph: number | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          gps_event_id: string
          heading_degrees?: number | null
          ignition_on?: boolean | null
          latitude: number
          longitude: number
          movement_state?: Database["public"]["Enums"]["movement_state"]
          odometer_km?: number | null
          organization_id: string
          recorded_at: string
          speed_kph?: number | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          gps_event_id?: string
          heading_degrees?: number | null
          ignition_on?: boolean | null
          latitude?: number
          longitude?: number
          movement_state?: Database["public"]["Enums"]["movement_state"]
          odometer_km?: number | null
          organization_id?: string
          recorded_at?: string
          speed_kph?: number | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_locations_gps_event_id_fkey"
            columns: ["gps_event_id"]
            isOneToOne: false
            referencedRelation: "gps_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          archived_at: string | null
          capacity_kg: number | null
          color: string | null
          created_at: string
          engine_number: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          license_plate: string | null
          make: string | null
          model: string | null
          notes: string | null
          odometer_km: number
          organization_id: string
          purchased_at: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
          unit_number: string
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vin: string | null
          year: number | null
        }
        Insert: {
          archived_at?: string | null
          capacity_kg?: number | null
          color?: string | null
          created_at?: string
          engine_number?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          odometer_km?: number
          organization_id: string
          purchased_at?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          unit_number: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vin?: string | null
          year?: number | null
        }
        Update: {
          archived_at?: string | null
          capacity_kg?: number | null
          color?: string | null
          created_at?: string
          engine_number?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          odometer_km?: number
          organization_id?: string
          purchased_at?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          unit_number?: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          archived_at: string | null
          category: Database["public"]["Enums"]["vendor_category"]
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          category?: Database["public"]["Enums"]["vendor_category"]
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          category?: Database["public"]["Enums"]["vendor_category"]
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          closed_at: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          maintenance_issue_id: string | null
          opened_at: string
          organization_id: string
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          total_cost: number | null
          updated_at: string
          vehicle_id: string
          vendor_id: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          maintenance_issue_id?: string | null
          opened_at?: string
          organization_id: string
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id: string
          vendor_id?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          maintenance_issue_id?: string | null
          opened_at?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_maintenance_issue_id_fkey"
            columns: ["maintenance_issue_id"]
            isOneToOne: false
            referencedRelation: "maintenance_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recent_activity_feed: {
        Row: {
          details: Json | null
          driver_id: string | null
          event_type: string | null
          occurred_at: string | null
          organization_id: string | null
          record_id: string | null
          vehicle_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["org_role"]
      }
      is_org_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      alert_status: "open" | "acknowledged" | "dismissed" | "resolved"
      alert_type:
        | "gps_offline"
        | "speed_threshold"
        | "fuel_anomaly"
        | "document_expiring"
        | "maintenance_due"
        | "geofence"
        | "other"
      contract_rate_type: "per_mile" | "per_trip" | "flat" | "hourly" | "other"
      contract_status: "draft" | "active" | "expired" | "terminated"
      delivery_status:
        | "PENDING"
        | "IN_TRANSIT"
        | "ARRIVED"
        | "DELIVERED"
        | "PARTIALLY_DELIVERED"
        | "REFUSED"
        | "DAMAGED"
        | "CANCELLED"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved"
        | "rejected"
        | "withdrawn"
      dispute_type:
        | "fuel_variance"
        | "damage_claim"
        | "delivery_dispute"
        | "payment_dispute"
        | "other"
      document_status: "active" | "expired" | "pending_renewal" | "archived"
      document_type_driver:
        | "license"
        | "medical_card"
        | "background_check"
        | "training_certificate"
        | "other"
      document_type_vehicle:
        | "registration"
        | "insurance"
        | "permit"
        | "inspection_certificate"
        | "title"
        | "other"
      driver_status:
        | "ACTIVE"
        | "INACTIVE"
        | "ON_LEAVE"
        | "SUSPENDED"
        | "TERMINATED"
      evidence_kind:
        | "fact"
        | "calculation"
        | "user_input"
        | "interpretation"
        | "decision"
      evidence_source:
        | "gps"
        | "document"
        | "photo"
        | "statement"
        | "system"
        | "other"
      expense_category:
        | "maintenance"
        | "insurance"
        | "permit"
        | "toll"
        | "parking"
        | "fine"
        | "office"
        | "other"
        | "parts"
        | "tires"
        | "driver_related"
      fuel_type: "diesel" | "gasoline" | "electric" | "cng" | "other"
      gps_connection_status: "active" | "paused" | "error" | "disconnected"
      gps_integration_type:
        | "rest_api"
        | "webhook"
        | "mqtt"
        | "tcp_socket"
        | "sdk"
        | "csv_import"
        | "database"
        | "manual"
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_status: "open" | "investigating" | "resolved" | "closed"
      incident_type:
        | "accident"
        | "traffic_violation"
        | "mechanical"
        | "cargo_damage"
        | "safety"
        | "other"
      inspection_type:
        | "pre_trip"
        | "post_trip"
        | "periodic"
        | "annual"
        | "other"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void"
      maintenance_issue_severity: "low" | "medium" | "high" | "critical"
      maintenance_issue_source:
        | "driver_report"
        | "inspection"
        | "gps_anomaly"
        | "scheduled"
        | "other"
      maintenance_issue_status:
        | "open"
        | "acknowledged"
        | "in_progress"
        | "resolved"
        | "wont_fix"
      movement_state: "moving" | "stationary" | "idle" | "unknown"
      org_role:
        | "owner"
        | "admin"
        | "dispatcher"
        | "manager"
        | "driver"
        | "viewer"
      payment_method: "cash" | "card" | "bank_transfer" | "check" | "other"
      record_state:
        | "active"
        | "voided"
        | "corrected"
        | "superseded"
        | "archived"
      trip_status:
        | "DRAFT"
        | "ASSIGNED"
        | "LOADING"
        | "DISPATCHED"
        | "IN_TRANSIT"
        | "ARRIVED"
        | "DELIVERED"
        | "COMPLETED"
        | "CANCELLED"
      trip_stop_status:
        | "PLANNED"
        | "ARRIVED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "SKIPPED"
      trip_stop_type: "pickup" | "dropoff" | "fuel" | "rest" | "other"
      vehicle_status:
        | "active"
        | "maintenance"
        | "out_of_service"
        | "sold"
        | "retired"
      vehicle_type: "truck" | "van" | "trailer" | "other"
      vendor_category:
        | "repair_shop"
        | "parts_supplier"
        | "fuel_station"
        | "insurance"
        | "other"
      work_order_status: "open" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["info", "warning", "critical"],
      alert_status: ["open", "acknowledged", "dismissed", "resolved"],
      alert_type: [
        "gps_offline",
        "speed_threshold",
        "fuel_anomaly",
        "document_expiring",
        "maintenance_due",
        "geofence",
        "other",
      ],
      contract_rate_type: ["per_mile", "per_trip", "flat", "hourly", "other"],
      contract_status: ["draft", "active", "expired", "terminated"],
      delivery_status: [
        "PENDING",
        "IN_TRANSIT",
        "ARRIVED",
        "DELIVERED",
        "PARTIALLY_DELIVERED",
        "REFUSED",
        "DAMAGED",
        "CANCELLED",
      ],
      dispute_status: [
        "open",
        "under_review",
        "resolved",
        "rejected",
        "withdrawn",
      ],
      dispute_type: [
        "fuel_variance",
        "damage_claim",
        "delivery_dispute",
        "payment_dispute",
        "other",
      ],
      document_status: ["active", "expired", "pending_renewal", "archived"],
      document_type_driver: [
        "license",
        "medical_card",
        "background_check",
        "training_certificate",
        "other",
      ],
      document_type_vehicle: [
        "registration",
        "insurance",
        "permit",
        "inspection_certificate",
        "title",
        "other",
      ],
      driver_status: [
        "ACTIVE",
        "INACTIVE",
        "ON_LEAVE",
        "SUSPENDED",
        "TERMINATED",
      ],
      evidence_kind: [
        "fact",
        "calculation",
        "user_input",
        "interpretation",
        "decision",
      ],
      evidence_source: [
        "gps",
        "document",
        "photo",
        "statement",
        "system",
        "other",
      ],
      expense_category: [
        "maintenance",
        "insurance",
        "permit",
        "toll",
        "parking",
        "fine",
        "office",
        "other",
        "parts",
        "tires",
        "driver_related",
      ],
      fuel_type: ["diesel", "gasoline", "electric", "cng", "other"],
      gps_connection_status: ["active", "paused", "error", "disconnected"],
      gps_integration_type: [
        "rest_api",
        "webhook",
        "mqtt",
        "tcp_socket",
        "sdk",
        "csv_import",
        "database",
        "manual",
      ],
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: ["open", "investigating", "resolved", "closed"],
      incident_type: [
        "accident",
        "traffic_violation",
        "mechanical",
        "cargo_damage",
        "safety",
        "other",
      ],
      inspection_type: ["pre_trip", "post_trip", "periodic", "annual", "other"],
      invoice_status: ["draft", "sent", "paid", "overdue", "void"],
      maintenance_issue_severity: ["low", "medium", "high", "critical"],
      maintenance_issue_source: [
        "driver_report",
        "inspection",
        "gps_anomaly",
        "scheduled",
        "other",
      ],
      maintenance_issue_status: [
        "open",
        "acknowledged",
        "in_progress",
        "resolved",
        "wont_fix",
      ],
      movement_state: ["moving", "stationary", "idle", "unknown"],
      org_role: ["owner", "admin", "dispatcher", "manager", "driver", "viewer"],
      payment_method: ["cash", "card", "bank_transfer", "check", "other"],
      record_state: ["active", "voided", "corrected", "superseded", "archived"],
      trip_status: [
        "DRAFT",
        "ASSIGNED",
        "LOADING",
        "DISPATCHED",
        "IN_TRANSIT",
        "ARRIVED",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ],
      trip_stop_status: [
        "PLANNED",
        "ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "SKIPPED",
      ],
      trip_stop_type: ["pickup", "dropoff", "fuel", "rest", "other"],
      vehicle_status: [
        "active",
        "maintenance",
        "out_of_service",
        "sold",
        "retired",
      ],
      vehicle_type: ["truck", "van", "trailer", "other"],
      vendor_category: [
        "repair_shop",
        "parts_supplier",
        "fuel_station",
        "insurance",
        "other",
      ],
      work_order_status: ["open", "in_progress", "completed", "cancelled"],
    },
  },
} as const
