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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cash_movements: {
        Row: {
          at: string
          cents: number
          created_by: string | null
          created_by_name: string | null
          establishment_id: string
          id: string
          kind: string
          reason: string
          session_id: string
        }
        Insert: {
          at?: string
          cents: number
          created_by?: string | null
          created_by_name?: string | null
          establishment_id: string
          id?: string
          kind: string
          reason: string
          session_id: string
        }
        Update: {
          at?: string
          cents?: number
          created_by?: string | null
          created_by_name?: string | null
          establishment_id?: string
          id?: string
          kind?: string
          reason?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          baseline: Json
          closed_at: string | null
          closed_by: string | null
          counted_cents: number | null
          difference_tx_id: string | null
          establishment_id: string
          expected_cents: number | null
          id: string
          opened_at: string
          opened_by: string | null
          opened_by_name: string | null
          opening_cents: number
          status: Database["public"]["Enums"]["cash_session_status"]
        }
        Insert: {
          baseline?: Json
          closed_at?: string | null
          closed_by?: string | null
          counted_cents?: number | null
          difference_tx_id?: string | null
          establishment_id: string
          expected_cents?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opened_by_name?: string | null
          opening_cents: number
          status?: Database["public"]["Enums"]["cash_session_status"]
        }
        Update: {
          baseline?: Json
          closed_at?: string | null
          closed_by?: string | null
          counted_cents?: number | null
          difference_tx_id?: string | null
          establishment_id?: string
          expected_cents?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opened_by_name?: string | null
          opening_cents?: number
          status?: Database["public"]["Enums"]["cash_session_status"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_difference_tx_fk"
            columns: ["difference_tx_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          establishment_id: string
          id: string
          is_internal: boolean
          name: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          establishment_id: string
          id?: string
          is_internal?: boolean
          name: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          establishment_id?: string
          id?: string
          is_internal?: boolean
          name?: string
          position?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      counters: {
        Row: {
          establishment_id: string
          key: string
          value: number
        }
        Insert: {
          establishment_id: string
          key: string
          value?: number
        }
        Update: {
          establishment_id?: string
          key?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "counters_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          available: boolean
          created_at: string
          establishment_id: string
          id: string
          kind: Database["public"]["Enums"]["courier_kind"]
          name: string
          phone: string
          pix_key: string
          user_id: string | null
          vehicle: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          establishment_id: string
          id?: string
          kind: Database["public"]["Enums"]["courier_kind"]
          name: string
          phone: string
          pix_key?: string
          user_id?: string | null
          vehicle?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          establishment_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["courier_kind"]
          name?: string
          phone?: string
          pix_key?: string
          user_id?: string | null
          vehicle?: string
        }
        Relationships: [
          {
            foreignKeyName: "couriers_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          baseline_orders: number
          baseline_products: Json
          baseline_spent_cents: number
          channel_note: string | null
          created_at: string
          establishment_id: string
          id: string
          name: string
          notes: string
          phone: string
          since: string | null
        }
        Insert: {
          baseline_orders?: number
          baseline_products?: Json
          baseline_spent_cents?: number
          channel_note?: string | null
          created_at?: string
          establishment_id: string
          id?: string
          name: string
          notes?: string
          phone: string
          since?: string | null
        }
        Update: {
          baseline_orders?: number
          baseline_products?: Json
          baseline_spent_cents?: number
          channel_note?: string | null
          created_at?: string
          establishment_id?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          since?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          at: string
          courier_id: string | null
          created_at: string
          establishment_id: string
          expected_at: string | null
          fee_cents: number | null
          id: string
          items: number
          order_id: string
          problem_note: string | null
          problem_prev: Json | null
          problem_reason: string | null
          return_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
        }
        Insert: {
          at?: string
          courier_id?: string | null
          created_at?: string
          establishment_id: string
          expected_at?: string | null
          fee_cents?: number | null
          id?: string
          items?: number
          order_id: string
          problem_note?: string | null
          problem_prev?: Json | null
          problem_reason?: string | null
          return_at?: string | null
          status: Database["public"]["Enums"]["delivery_status"]
        }
        Update: {
          at?: string
          courier_id?: string | null
          created_at?: string
          establishment_id?: string
          expected_at?: string | null
          fee_cents?: number | null
          id?: string
          items?: number
          order_id?: string
          problem_note?: string | null
          problem_prev?: Json | null
          problem_reason?: string | null
          return_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          hours: Json
          id: string
          name: string
          settings: Json
          slug: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          hours?: Json
          id?: string
          name: string
          settings?: Json
          slug: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          hours?: Json
          id?: string
          name?: string
          settings?: Json
          slug?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          establishment_id: string
          id: string
          kind: Database["public"]["Enums"]["account_kind"]
          name: string
        }
        Insert: {
          establishment_id: string
          id?: string
          kind: Database["public"]["Enums"]["account_kind"]
          name: string
        }
        Update: {
          establishment_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["account_kind"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          direction: Database["public"]["Enums"]["entry_direction"]
          due_at: string
          establishment_id: string
          generated_from: string | null
          id: string
          kind_label: string | null
          note: string | null
          origin: string
          paid_at: string | null
          paid_cents: number
          recurring: boolean
          ref: string | null
          supplier_id: string | null
          tag: string | null
          title: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description: string
          direction: Database["public"]["Enums"]["entry_direction"]
          due_at: string
          establishment_id: string
          generated_from?: string | null
          id?: string
          kind_label?: string | null
          note?: string | null
          origin: string
          paid_at?: string | null
          paid_cents?: number
          recurring?: boolean
          ref?: string | null
          supplier_id?: string | null
          tag?: string | null
          title?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          direction?: Database["public"]["Enums"]["entry_direction"]
          due_at?: string
          establishment_id?: string
          generated_from?: string | null
          id?: string
          kind_label?: string | null
          note?: string | null
          origin?: string
          paid_at?: string | null
          paid_cents?: number
          recurring?: boolean
          ref?: string | null
          supplier_id?: string | null
          tag?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_generated_from_fkey"
            columns: ["generated_from"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string
          amount_cents: number
          at: string
          entry_id: string | null
          establishment_id: string
          id: string
          kind: Database["public"]["Enums"]["tx_kind"]
          note: string
          order_id: string | null
          principal_cents: number | null
          receipt_path: string | null
          reversal_of: string | null
          title: string
          transfer_id: string | null
        }
        Insert: {
          account_id: string
          amount_cents: number
          at?: string
          entry_id?: string | null
          establishment_id: string
          id?: string
          kind: Database["public"]["Enums"]["tx_kind"]
          note?: string
          order_id?: string | null
          principal_cents?: number | null
          receipt_path?: string | null
          reversal_of?: string | null
          title: string
          transfer_id?: string | null
        }
        Update: {
          account_id?: string
          amount_cents?: number
          at?: string
          entry_id?: string | null
          establishment_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["tx_kind"]
          note?: string
          order_id?: string | null
          principal_cents?: number | null
          receipt_path?: string | null
          reversal_of?: string | null
          title?: string
          transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_balances"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_items: {
        Row: {
          cost_cents: number
          id: string
          lot_id: string | null
          product_id: string
          purchase_order_item_id: string | null
          qty: number
          receipt_id: string
        }
        Insert: {
          cost_cents?: number
          id?: string
          lot_id?: string | null
          product_id: string
          purchase_order_item_id?: string | null
          qty: number
          receipt_id: string
        }
        Update: {
          cost_cents?: number
          id?: string
          lot_id?: string | null
          product_id?: string
          purchase_order_item_id?: string | null
          qty?: number
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot_balances"
            referencedColumns: ["lot_id"]
          },
          {
            foreignKeyName: "goods_receipt_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "goods_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          establishment_id: string
          id: string
          purchase_order_id: string
          received_at: string
          received_by: string | null
          total_cents: number
          undone_at: string | null
        }
        Insert: {
          establishment_id: string
          id?: string
          purchase_order_id: string
          received_at?: string
          received_by?: string | null
          total_cents?: number
          undone_at?: string | null
        }
        Update: {
          establishment_id?: string
          id?: string
          purchase_order_id?: string
          received_at?: string
          received_by?: string | null
          total_cents?: number
          undone_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipts_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_count_items: {
        Row: {
          count_id: string
          counted: number
          id: string
          product_id: string
          system_qty: number
        }
        Insert: {
          count_id: string
          counted: number
          id?: string
          product_id: string
          system_qty: number
        }
        Update: {
          count_id?: string
          counted?: number
          id?: string
          product_id?: string
          system_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          created_at: string
          created_by: string | null
          establishment_id: string
          id: string
          undone_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          establishment_id: string
          id?: string
          undone_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          establishment_id?: string
          id?: string
          undone_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_pins: {
        Row: {
          membership_id: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          membership_id: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          membership_id?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_pins_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: true
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          establishment_id: string
          id: string
          note: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["membership_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          establishment_id: string
          id?: string
          note?: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          establishment_id?: string
          id?: string
          note?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          kind: string
          lots: Json
          name: string
          order_id: string
          product_id: string | null
          qty: number
          total_cents: number
          unit: string
          unit_price_cents: number
        }
        Insert: {
          id?: string
          kind?: string
          lots?: Json
          name: string
          order_id: string
          product_id?: string | null
          qty: number
          total_cents: number
          unit?: string
          unit_price_cents: number
        }
        Update: {
          id?: string
          kind?: string
          lots?: Json
          name?: string
          order_id?: string
          product_id?: string | null
          qty?: number
          total_cents?: number
          unit?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: Json | null
          approved_by_name: string | null
          cancelled_at: string | null
          cancelled_by_name: string | null
          cash_session_id: string | null
          change_for_cents: number | null
          channel: Database["public"]["Enums"]["order_channel"]
          contact_name: string
          contact_phone: string
          courier_name: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          customer_id: string | null
          customer_user_id: string | null
          delivery_code: string | null
          delivery_fee_cents: number
          delivery_window: Json | null
          discount_cents: number
          discount_kind: string | null
          discount_reason: string | null
          establishment_id: string
          eta_label: string | null
          fulfillment: Database["public"]["Enums"]["fulfillment"]
          id: string
          number: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_paid: boolean
          pending_sync: boolean
          status: Database["public"]["Enums"]["order_status"]
          step_times: Json
          subtotal_cents: number
          total_cents: number
        }
        Insert: {
          address?: Json | null
          approved_by_name?: string | null
          cancelled_at?: string | null
          cancelled_by_name?: string | null
          cash_session_id?: string | null
          change_for_cents?: number | null
          channel: Database["public"]["Enums"]["order_channel"]
          contact_name?: string
          contact_phone?: string
          courier_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_user_id?: string | null
          delivery_code?: string | null
          delivery_fee_cents?: number
          delivery_window?: Json | null
          discount_cents?: number
          discount_kind?: string | null
          discount_reason?: string | null
          establishment_id: string
          eta_label?: string | null
          fulfillment: Database["public"]["Enums"]["fulfillment"]
          id?: string
          number: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_paid?: boolean
          pending_sync?: boolean
          status?: Database["public"]["Enums"]["order_status"]
          step_times?: Json
          subtotal_cents: number
          total_cents: number
        }
        Update: {
          address?: Json | null
          approved_by_name?: string | null
          cancelled_at?: string | null
          cancelled_by_name?: string | null
          cash_session_id?: string | null
          change_for_cents?: number | null
          channel?: Database["public"]["Enums"]["order_channel"]
          contact_name?: string
          contact_phone?: string
          courier_name?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customer_id?: string | null
          customer_user_id?: string | null
          delivery_code?: string | null
          delivery_fee_cents?: number
          delivery_window?: Json | null
          discount_cents?: number
          discount_kind?: string | null
          discount_reason?: string | null
          establishment_id?: string
          eta_label?: string | null
          fulfillment?: Database["public"]["Enums"]["fulfillment"]
          id?: string
          number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_paid?: boolean
          pending_sync?: boolean
          status?: Database["public"]["Enums"]["order_status"]
          step_times?: Json
          subtotal_cents?: number
          total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox_messages: {
        Row: {
          body: string
          created_at: string
          establishment_id: string
          id: string
          kind: string
          recipient: string
          sent_at: string | null
        }
        Insert: {
          body: string
          created_at?: string
          establishment_id: string
          id?: string
          kind: string
          recipient: string
          sent_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          establishment_id?: string
          id?: string
          kind?: string
          recipient?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbox_messages_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          cents: number
          created_at: string
          establishment_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          received_cents: number | null
        }
        Insert: {
          cents: number
          created_at?: string
          establishment_id: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          received_cents?: number | null
        }
        Update: {
          cents?: number
          created_at?: string
          establishment_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          received_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_failures: {
        Row: {
          at: string
          establishment_id: string
          id: number
          user_id: string
        }
        Insert: {
          at?: string
          establishment_id: string
          id?: never
          user_id: string
        }
        Update: {
          at?: string
          establishment_id?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pin_failures_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lots: {
        Row: {
          code: string
          establishment_id: string
          expires_at: string | null
          id: string
          product_id: string
          received_at: string
          source: string | null
          unit_cost_cents: number
        }
        Insert: {
          code: string
          establishment_id: string
          expires_at?: string | null
          id?: string
          product_id: string
          received_at?: string
          source?: string | null
          unit_cost_cents?: number
        }
        Update: {
          code?: string
          establishment_id?: string
          expires_at?: string | null
          id?: string
          product_id?: string
          received_at?: string
          source?: string | null
          unit_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_consumptions: {
        Row: {
          id: string
          lot_id: string | null
          movement_id: string | null
          product_id: string
          production_order_id: string
          qty: number
        }
        Insert: {
          id?: string
          lot_id?: string | null
          movement_id?: string | null
          product_id: string
          production_order_id: string
          qty: number
        }
        Update: {
          id?: string
          lot_id?: string | null
          movement_id?: string | null
          product_id?: string
          production_order_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_consumptions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot_balances"
            referencedColumns: ["lot_id"]
          },
          {
            foreignKeyName: "production_consumptions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_consumptions_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_consumptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "production_consumptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_consumptions_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          batches: number
          cost_per_unit_cents: number | null
          created_at: string
          created_by: string | null
          destination_order_id: string | null
          done_at: string | null
          ends_at: string | null
          establishment_id: string
          good_qty: number | null
          id: string
          lot_id: string | null
          number: string
          planned_qty: number
          product_id: string
          recipe_id: string
          started_at: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["production_status"]
        }
        Insert: {
          batches: number
          cost_per_unit_cents?: number | null
          created_at?: string
          created_by?: string | null
          destination_order_id?: string | null
          done_at?: string | null
          ends_at?: string | null
          establishment_id: string
          good_qty?: number | null
          id?: string
          lot_id?: string | null
          number: string
          planned_qty: number
          product_id: string
          recipe_id: string
          started_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["production_status"]
        }
        Update: {
          batches?: number
          cost_per_unit_cents?: number | null
          created_at?: string
          created_by?: string | null
          destination_order_id?: string | null
          done_at?: string | null
          ends_at?: string | null
          establishment_id?: string
          good_qty?: number | null
          id?: string
          lot_id?: string | null
          number?: string
          planned_qty?: number
          product_id?: string
          recipe_id?: string
          started_at?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["production_status"]
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot_balances"
            referencedColumns: ["lot_id"]
          },
          {
            foreignKeyName: "production_orders_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          content_qty: number | null
          content_unit: string | null
          created_at: string
          description: string
          details: Json
          establishment_id: string
          id: string
          is_active: boolean
          is_favorite_pos: boolean
          is_published: boolean
          item_type: Database["public"]["Enums"]["item_type"]
          last_cost_cents: number | null
          min_stock: number
          name: string
          origin: Database["public"]["Enums"]["item_origin"] | null
          price_cents: number | null
          slug: string
          sold_by_weight: boolean
          supplier_id: string | null
          tracks_expiry: boolean
          unit: string
          updated_at: string
          weight_price_cents: number | null
        }
        Insert: {
          category_id?: string | null
          content_qty?: number | null
          content_unit?: string | null
          created_at?: string
          description?: string
          details?: Json
          establishment_id: string
          id?: string
          is_active?: boolean
          is_favorite_pos?: boolean
          is_published?: boolean
          item_type: Database["public"]["Enums"]["item_type"]
          last_cost_cents?: number | null
          min_stock?: number
          name: string
          origin?: Database["public"]["Enums"]["item_origin"] | null
          price_cents?: number | null
          slug: string
          sold_by_weight?: boolean
          supplier_id?: string | null
          tracks_expiry?: boolean
          unit?: string
          updated_at?: string
          weight_price_cents?: number | null
        }
        Update: {
          category_id?: string | null
          content_qty?: number | null
          content_unit?: string | null
          created_at?: string
          description?: string
          details?: Json
          establishment_id?: string
          id?: string
          is_active?: boolean
          is_favorite_pos?: boolean
          is_published?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          last_cost_cents?: number | null
          min_stock?: number
          name?: string
          origin?: Database["public"]["Enums"]["item_origin"] | null
          price_cents?: number | null
          slug?: string
          sold_by_weight?: boolean
          supplier_id?: string | null
          tracks_expiry?: boolean
          unit?: string
          updated_at?: string
          weight_price_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          id: string
          product_id: string
          purchase_order_id: string
          qty: number
          received_qty: number
          unit_cost_cents: number
        }
        Insert: {
          id?: string
          product_id: string
          purchase_order_id: string
          qty: number
          received_qty?: number
          unit_cost_cents?: number
        }
        Update: {
          id?: string
          product_id?: string
          purchase_order_id?: string
          qty?: number
          received_qty?: number
          unit_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          establishment_id: string
          expected_at: string | null
          id: string
          message_text: string | null
          notes: string
          number: string
          payment_term: string | null
          received_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["po_status"]
          supplier_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          establishment_id: string
          expected_at?: string | null
          id?: string
          message_text?: string | null
          notes?: string
          number: string
          payment_term?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          establishment_id?: string
          expected_at?: string | null
          id?: string
          message_text?: string | null
          notes?: string
          number?: string
          payment_term?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          id: string
          product_id: string
          qty_per_batch: number
          recipe_id: string
        }
        Insert: {
          id?: string
          product_id: string
          qty_per_batch: number
          recipe_id: string
        }
        Update: {
          id?: string
          product_id?: string
          qty_per_batch?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "recipe_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          batch_label: string
          created_at: string
          establishment_id: string
          id: string
          lot_prefix: string
          method: string
          overhead_cents: number
          product_id: string
          shelf_life_days: number | null
          yield_per_batch: number
        }
        Insert: {
          batch_label?: string
          created_at?: string
          establishment_id: string
          id?: string
          lot_prefix?: string
          method?: string
          overhead_cents?: number
          product_id: string
          shelf_life_days?: number | null
          yield_per_batch: number
        }
        Update: {
          batch_label?: string
          created_at?: string
          establishment_id?: string
          id?: string
          lot_prefix?: string
          method?: string
          overhead_cents?: number
          product_id?: string
          shelf_life_days?: number | null
          yield_per_batch?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_modules: {
        Row: {
          module: Database["public"]["Enums"]["app_module"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          module: Database["public"]["Enums"]["app_module"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          module?: Database["public"]["Enums"]["app_module"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          at: string
          batch_id: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          establishment_id: string
          id: string
          lot_id: string | null
          product_id: string
          qty: number
          ref: string
          reversal_of: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          at?: string
          batch_id?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          establishment_id: string
          id?: string
          lot_id?: string | null
          product_id: string
          qty: number
          ref?: string
          reversal_of?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          at?: string
          batch_id?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          establishment_id?: string
          id?: string
          lot_id?: string | null
          product_id?: string
          qty?: number
          ref?: string
          reversal_of?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lot_balances"
            referencedColumns: ["lot_id"]
          },
          {
            foreignKeyName: "stock_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "stock_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          created_at: string
          created_by: string | null
          establishment_id: string
          id: string
          product_id: string
          qty: number
          ref: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          establishment_id: string
          id?: string
          product_id: string
          qty: number
          ref?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          establishment_id?: string
          id?: string
          product_id?: string
          qty?: number
          ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          establishment_id: string
          id: string
          lead_time_days: number | null
          name: string
          notes: string
          payment_terms: string | null
          phone: string | null
          previous_purchases_cents: number
          supplies: string
          tax_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          establishment_id: string
          id?: string
          lead_time_days?: number | null
          name: string
          notes?: string
          payment_terms?: string | null
          phone?: string | null
          previous_purchases_cents?: number
          supplies?: string
          tax_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          establishment_id?: string
          id?: string
          lead_time_days?: number | null
          name?: string
          notes?: string
          payment_terms?: string | null
          phone?: string | null
          previous_purchases_cents?: number
          supplies?: string
          tax_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      account_balances: {
        Row: {
          account_id: string | null
          balance_cents: number | null
          establishment_id: string | null
          kind: Database["public"]["Enums"]["account_kind"] | null
          name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      lot_balances: {
        Row: {
          balance: number | null
          code: string | null
          establishment_id: string | null
          expires_at: string | null
          lot_id: string | null
          product_id: string | null
          received_at: string | null
          unit_cost_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_lots_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_balances"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_balances: {
        Row: {
          available: number | null
          establishment_id: string | null
          min_stock: number | null
          name: string | null
          physical: number | null
          product_id: string | null
          reserved: number | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      courier_accept: { Args: { p_order: string }; Returns: undefined }
      courier_confirm: {
        Args: { p_code: string; p_order: string }
        Returns: undefined
      }
      courier_depart: { Args: { p_order: string }; Returns: undefined }
      courier_detail: { Args: { p_order: string }; Returns: Json }
      courier_history: { Args: never; Returns: Json }
      courier_link: { Args: never; Returns: Json }
      courier_list: { Args: never; Returns: Json }
      courier_problem: {
        Args: { p_note?: string; p_order: string; p_reason: string }
        Returns: undefined
      }
      courier_save_pix: { Args: { p_key: string }; Returns: undefined }
      courier_set_available: {
        Args: { p_available: boolean }
        Returns: undefined
      }
      courier_take: { Args: { p_order: string }; Returns: undefined }
      courier_undo_problem: { Args: { p_order: string }; Returns: undefined }
      delivery_assign: {
        Args: { p_courier?: string; p_order: string }
        Returns: Json
      }
      delivery_expire_published: {
        Args: { p_establishment: string }
        Returns: number
      }
      delivery_unassign: { Args: { p_order: string }; Returns: undefined }
      finish_production: {
        Args: {
          p_expires_at?: string
          p_good_qty: number
          p_lot_code?: string
          p_order: string
        }
        Returns: Json
      }
      order_accept: { Args: { p_order: string }; Returns: Json }
      order_complete_pickup: { Args: { p_order: string }; Returns: Json }
      order_mark_ready: {
        Args: { p_checked: string[]; p_order: string }
        Returns: Json
      }
      order_undo_ready: { Args: { p_order: string }; Returns: Json }
      pay_entry: {
        Args: {
          p_account: string
          p_amount_cents: number
          p_entry: string
          p_fine_cents: number
          p_method: string
          p_paid_at?: string
        }
        Returns: Json
      }
      place_order: { Args: { p_order: Json; p_slug: string }; Returns: Json }
      pos_cancel_sale: {
        Args: { p_order: string; p_pin: string }
        Returns: Json
      }
      pos_cash_movement: {
        Args: {
          p_cents: number
          p_establishment: string
          p_kind: string
          p_reason: string
        }
        Returns: Json
      }
      pos_checkout: {
        Args: { p_establishment: string; p_sale: Json }
        Returns: Json
      }
      pos_close_session: {
        Args: { p_counted_cents: number; p_establishment: string }
        Returns: Json
      }
      pos_open_session: {
        Args: { p_establishment: string; p_opening_cents: number }
        Returns: string
      }
      pos_reopen_session: { Args: { p_establishment: string }; Returns: string }
      pos_send_receipt: {
        Args: { p_order: string; p_phone: string }
        Returns: string
      }
      pos_sync_pending: { Args: { p_establishment: string }; Returns: number }
      receive_purchase: {
        Args: {
          p_close_short?: boolean
          p_due_at?: string
          p_lines: Json
          p_payment_label?: string
          p_po: string
        }
        Returns: Json
      }
      set_my_pin: {
        Args: { p_establishment: string; p_pin: string }
        Returns: undefined
      }
      stock_adjust: {
        Args: {
          p_add?: boolean
          p_kind: string
          p_lot: string
          p_product: string
          p_qty: number
          p_reason?: string
        }
        Returns: string
      }
      stock_count_apply: {
        Args: { p_establishment: string; p_lines: Json }
        Returns: Json
      }
      stock_count_undo: { Args: { p_count: string }; Returns: number }
      stock_reverse: { Args: { p_movement: string }; Returns: string }
      store_catalog: {
        Args: { p_slug: string }
        Returns: {
          category_slug: string
          description: string
          details: Json
          name: string
          origin: Database["public"]["Enums"]["item_origin"]
          price_cents: number
          slug: string
          unit: string
        }[]
      }
      store_categories: {
        Args: { p_slug: string }
        Returns: {
          name: string
          position: number
          slug: string
        }[]
      }
      store_info: { Args: { p_slug: string }; Returns: Json }
      track_order: {
        Args: { p_number: string; p_phone: string; p_slug: string }
        Returns: Json
      }
      track_orders: {
        Args: { p_numbers: string[]; p_phone: string; p_slug: string }
        Returns: Json
      }
      undo_finish_production: { Args: { p_order: string }; Returns: undefined }
      undo_payment: { Args: { p_transaction: string }; Returns: undefined }
      undo_receipt: { Args: { p_receipt: string }; Returns: undefined }
    }
    Enums: {
      account_kind: "bank" | "cash"
      app_module:
        | "dashboard"
        | "orders"
        | "pos"
        | "stock"
        | "purchasing"
        | "production"
        | "finance"
        | "deliveries"
        | "team"
      app_role: "owner" | "manager" | "clerk" | "production" | "courier"
      cash_session_status: "open" | "closed"
      courier_kind: "own" | "partner"
      delivery_status:
        | "published"
        | "reserved"
        | "assigned"
        | "accepted"
        | "en_route"
        | "delivered"
        | "returned"
      entry_direction: "payable" | "receivable"
      fulfillment: "delivery" | "pickup" | "counter"
      item_origin: "house" | "brand" | "resale"
      item_type: "resale" | "raw_material" | "finished"
      membership_status: "active" | "invited" | "disabled"
      movement_type:
        | "purchase_in"
        | "production_in"
        | "production_out"
        | "sale_out"
        | "adjustment"
        | "loss"
        | "inventory"
      order_channel: "online" | "pos"
      order_status:
        | "received"
        | "preparing"
        | "ready_for_delivery"
        | "out_for_delivery"
        | "delivered"
        | "ready_for_pickup"
        | "picked_up"
        | "completed"
        | "cancelled"
      payment_method: "pix" | "card_on_delivery" | "cash" | "debit" | "credit"
      po_status:
        | "draft"
        | "sent"
        | "partially_received"
        | "received"
        | "cancelled"
      production_status: "planned" | "in_progress" | "done"
      tx_kind:
        | "opening"
        | "sale"
        | "payment"
        | "settlement"
        | "transfer"
        | "manual"
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
      account_kind: ["bank", "cash"],
      app_module: [
        "dashboard",
        "orders",
        "pos",
        "stock",
        "purchasing",
        "production",
        "finance",
        "deliveries",
        "team",
      ],
      app_role: ["owner", "manager", "clerk", "production", "courier"],
      cash_session_status: ["open", "closed"],
      courier_kind: ["own", "partner"],
      delivery_status: [
        "published",
        "reserved",
        "assigned",
        "accepted",
        "en_route",
        "delivered",
        "returned",
      ],
      entry_direction: ["payable", "receivable"],
      fulfillment: ["delivery", "pickup", "counter"],
      item_origin: ["house", "brand", "resale"],
      item_type: ["resale", "raw_material", "finished"],
      membership_status: ["active", "invited", "disabled"],
      movement_type: [
        "purchase_in",
        "production_in",
        "production_out",
        "sale_out",
        "adjustment",
        "loss",
        "inventory",
      ],
      order_channel: ["online", "pos"],
      order_status: [
        "received",
        "preparing",
        "ready_for_delivery",
        "out_for_delivery",
        "delivered",
        "ready_for_pickup",
        "picked_up",
        "completed",
        "cancelled",
      ],
      payment_method: ["pix", "card_on_delivery", "cash", "debit", "credit"],
      po_status: [
        "draft",
        "sent",
        "partially_received",
        "received",
        "cancelled",
      ],
      production_status: ["planned", "in_progress", "done"],
      tx_kind: [
        "opening",
        "sale",
        "payment",
        "settlement",
        "transfer",
        "manual",
      ],
    },
  },
} as const
