import type { AppRole } from "@/types/auth";
import type { VehicleSize } from "@/types/catalog";
import type { InventoryItemType, InventoryMovementType, InventoryStockStatus, InventoryUnit } from "@/types/inventory";

export type Json =
  | boolean
  | null
  | number
  | string
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      vehicle_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          size_class: VehicleSize;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          size_class: VehicleSize;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          size_class?: VehicleSize;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_prices: {
        Row: {
          id: string;
          service_id: string;
          size_class: VehicleSize;
          price: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          size_class: VehicleSize;
          price: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          size_class?: VehicleSize;
          price?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_prices_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          item_type: InventoryItemType;
          unit: InventoryUnit;
          current_stock: number;
          minimum_stock: number;
          stock_status: InventoryStockStatus;
          selling_price: number | null;
          description: string | null;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          item_type: InventoryItemType;
          unit: InventoryUnit;
          minimum_stock?: number;
          selling_price?: number | null;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          item_type?: InventoryItemType;
          unit?: InventoryUnit;
          minimum_stock?: number;
          selling_price?: number | null;
          description?: string | null;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          inventory_item_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          stock_before: number;
          stock_after: number;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          stock_before: number;
          stock_after: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          movement_type?: InventoryMovementType;
          quantity?: number;
          stock_before?: number;
          stock_after?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      service_inventory_requirements: {
        Row: {
          id: string;
          service_id: string;
          inventory_item_id: string;
          quantity_required: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          inventory_item_id: string;
          quantity_required: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          inventory_item_id?: string;
          quantity_required?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_inventory_requirements_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_inventory_requirements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          mobile_number: string;
          mobile_number_normalized: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          mobile_number: string;
          mobile_number_normalized: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          mobile_number?: string;
          mobile_number_normalized?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_vehicles: {
        Row: {
          id: string;
          customer_id: string;
          vehicle_category_id: string;
          plate_number: string | null;
          plate_number_normalized: string | null;
          make: string | null;
          model: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vehicle_category_id: string;
          plate_number?: string | null;
          plate_number_normalized?: string | null;
          make?: string | null;
          model?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vehicle_category_id?: string;
          plate_number?: string | null;
          plate_number_normalized?: string | null;
          make?: string | null;
          model?: string | null;
          color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_vehicles_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_vehicles_vehicle_category_id_fkey";
            columns: ["vehicle_category_id"];
            isOneToOne: false;
            referencedRelation: "vehicle_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          transaction_number: string;
          idempotency_key: string;
          customer_id: string;
          vehicle_id: string;
          customer_name_snapshot: string;
          vehicle_category_name_snapshot: string;
          plate_number_snapshot: string | null;
          make_snapshot: string | null;
          model_snapshot: string | null;
          color_snapshot: string | null;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          service_subtotal: number;
          product_subtotal: number;
          total: number;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          transaction_number: string;
          idempotency_key: string;
          customer_id: string;
          vehicle_id: string;
          customer_name_snapshot: string;
          vehicle_category_name_snapshot: string;
          plate_number_snapshot?: string | null;
          make_snapshot?: string | null;
          model_snapshot?: string | null;
          color_snapshot?: string | null;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          service_subtotal?: number;
          product_subtotal?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          transaction_number?: string;
          idempotency_key?: string;
          customer_id?: string;
          vehicle_id?: string;
          customer_name_snapshot?: string;
          vehicle_category_name_snapshot?: string;
          plate_number_snapshot?: string | null;
          make_snapshot?: string | null;
          model_snapshot?: string | null;
          color_snapshot?: string | null;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          service_subtotal?: number;
          product_subtotal?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "customer_vehicles";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_services: {
        Row: {
          id: string;
          transaction_id: string;
          service_id: string;
          service_name_snapshot: string;
          size_class_snapshot: VehicleSize;
          unit_price: number;
          quantity: number;
          line_total: number;
          line_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          service_id: string;
          service_name_snapshot: string;
          size_class_snapshot: VehicleSize;
          unit_price: number;
          quantity?: number;
          line_total: number;
          line_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          service_id?: string;
          service_name_snapshot?: string;
          size_class_snapshot?: VehicleSize;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          line_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_services_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_products: {
        Row: {
          id: string;
          transaction_id: string;
          inventory_item_id: string;
          product_name_snapshot: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          line_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          inventory_item_id: string;
          product_name_snapshot: string;
          unit_price: number;
          quantity: number;
          line_total: number;
          line_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          inventory_item_id?: string;
          product_name_snapshot?: string;
          unit_price?: number;
          quantity?: number;
          line_total?: number;
          line_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_products_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_products_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          id: string;
          name: string;
          mobile_number: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mobile_number?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          mobile_number?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transaction_staff: {
        Row: {
          transaction_id: string;
          staff_id: string;
          share_percent: number;
          service_sales_snapshot: number | null;
          earnings_snapshot: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          transaction_id: string;
          staff_id: string;
          share_percent: number;
          service_sales_snapshot?: number | null;
          earnings_snapshot?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          transaction_id?: string;
          staff_id?: string;
          share_percent?: number;
          service_sales_snapshot?: number | null;
          earnings_snapshot?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_staff_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_staff_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: AppRole;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: AppRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: AppRole;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_inventory_movement: {
        Args: {
          p_inventory_item_id: string;
          p_movement_type: InventoryMovementType;
          p_quantity: number;
          p_notes?: string | null;
        };
        Returns: {
          id: string;
          inventory_item_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          stock_before: number;
          stock_after: number;
          reference_type: string | null;
          reference_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
      };
      get_public_check_in_catalog: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      submit_public_check_in: {
        Args: {
          p_idempotency_key: string;
          p_first_name: string;
          p_last_name: string;
          p_mobile_number: string;
          p_email?: string | null;
          p_vehicle_category_id?: string | null;
          p_plate_number?: string | null;
          p_make?: string | null;
          p_model?: string | null;
          p_color?: string | null;
          p_service_ids?: string[] | null;
          p_product_lines?: Json;
        };
        Returns: Json;
      };
      revise_pending_transaction: {
        Args: {
          p_transaction_id: string;
          p_first_name: string;
          p_last_name: string;
          p_mobile_number: string;
          p_email: string | null;
          p_vehicle_category_id: string;
          p_plate_number: string | null;
          p_make: string | null;
          p_model: string | null;
          p_color: string | null;
          p_service_ids: string[];
          p_product_lines: Json;
        };
        Returns: Json;
      };
      confirm_pending_transaction: {
        Args: {
          p_transaction_id: string;
        };
        Returns: Json;
      };
      cancel_transaction: {
        Args: {
          p_transaction_id: string;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      complete_confirmed_transaction: {
        Args: {
          p_transaction_id: string;
        };
        Returns: Json;
      };
      replace_transaction_staff: {
        Args: {
          p_transaction_id: string;
          p_assignments: Json;
        };
        Returns: Json;
      };
      get_admin_sales_report: {
        Args: {
          p_start_date?: string | null;
          p_end_date?: string | null;
        };
        Returns: Json;
      };
      get_admin_sales_report_page: {
        Args: {
          p_start_date?: string | null;
          p_end_date?: string | null;
          p_page?: number;
          p_page_size?: number;
        };
        Returns: Json;
      };
      get_admin_client_directory: {
        Args: {
          p_search?: string | null;
          p_page?: number;
          p_page_size?: number;
          p_sort?: string;
        };
        Returns: Json;
      };
      get_admin_client_detail: {
        Args: {
          p_customer_id: string;
        };
        Returns: Json;
      };
      update_admin_customer_profile: {
        Args: {
          p_customer_id: string;
          p_first_name: string;
          p_last_name: string;
          p_mobile_number: string;
          p_email?: string | null;
        };
        Returns: Json;
      };
      update_admin_customer_vehicle: {
        Args: {
          p_vehicle_id: string;
          p_vehicle_category_id: string;
          p_plate_number?: string | null;
          p_make?: string | null;
          p_model?: string | null;
          p_color?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: AppRole;
      vehicle_size: VehicleSize;
      inventory_item_type: InventoryItemType;
      inventory_unit: InventoryUnit;
      inventory_movement_type: InventoryMovementType;
      transaction_status: "pending" | "confirmed" | "completed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
