/**
 * Tipos reflejando el esquema real en Supabase (proyecto rnxnieigeizpajkjnxfi).
 * Actualízalos con `npx supabase gen types typescript --project-id rnxnieigeizpajkjnxfi`
 * si el esquema cambia más adelante.
 */

export type UserRole = "cliente" | "prestamista_admin" | "plataforma_admin";
export type EstadoCliente = "activo" | "inactivo" | "en_mora";
export type EstadoPrestamo = "pendiente" | "revision" | "aprobado" | "rechazado" | "activo" | "pagado" | "en_mora" | "cancelado";
export type FrecuenciaPago = "semanal" | "quincenal" | "mensual";
export type EstadoCuota = "pendiente" | "pagada" | "parcial" | "vencida";
export type MetodoPago = "efectivo" | "transferencia" | "paypal";
export type EstadoPago = "pendiente" | "confirmado" | "rechazado";
export type TipoGarantia = "telefono" | "tv" | "vehiculo" | "joyas" | "electronico" | "otro";
export type EstadoGarantia = "pendiente_verificacion" | "verificada" | "rechazada" | "devuelta";

export interface Prestamista {
  id: string;
  nombre_negocio: string;
  slug: string;
  logo_url: string | null;
  color_primario: string;
  color_acento: string;
  activo: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  prestamista_id: string | null;
  role: UserRole;
  nombre: string;
  telefono: string | null;
  cedula: string | null;
  created_at: string;
}

export interface Cliente {
  id: string;
  prestamista_id: string;
  profile_id: string | null;
  nombre_completo: string;
  cedula: string | null;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  estado: EstadoCliente;
  notas: string | null;
  created_at: string;
}

export interface Prestamo {
  id: string;
  prestamista_id: string;
  cliente_id: string;
  monto_solicitado: number;
  monto_aprobado: number | null;
  tasa_interes: number;
  plazo_cuotas: number;
  frecuencia_pago: FrecuenciaPago;
  estado: EstadoPrestamo;
  motivo_rechazo: string | null;
  saldo_pendiente: number | null;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  aprobado_por: string | null;
  created_at: string;
}

export interface Cuota {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_cuota: number;
  monto_pagado: number;
  estado: EstadoCuota;
}

export interface Pago {
  id: string;
  prestamista_id: string;
  prestamo_id: string;
  cuota_id: string | null;
  monto: number;
  metodo: MetodoPago;
  estado: EstadoPago;
  comprobante_url: string | null;
  fecha_pago: string;
  registrado_por: string | null;
  notas: string | null;
}

export interface Garantia {
  id: string;
  prestamo_id: string;
  tipo: TipoGarantia;
  descripcion: string;
  valor_estimado: number | null;
  fotos: string[];
  documentos: string[];
  estado: EstadoGarantia;
}

export interface ConfiguracionPlataforma {
  prestamista_id: string;
  nombre_publico: string | null;
  logo_url: string | null;
  color_primario: string | null;
  color_acento: string | null;
  hero_titulo: string | null;
  hero_subtitulo: string | null;
  banners: unknown[];
  faq: unknown[];
  contacto: Record<string, string>;
  redes_sociales: Record<string, string>;
  metodos_pago_activos: MetodoPago[];
  info_transferencia: Record<string, string>;
  config_prestamos: Record<string, unknown>;
  funciones_activas: Record<string, boolean>;
}

// Forma completa que espera @supabase/supabase-js para tipar el cliente
// correctamente. Faltaban Views/Functions/Enums/CompositeTypes — sin ellos,
// la librería no logra inferir bien los tipos de "update"/"insert" y los
// trata como si no existieran (de ahí el error "not assignable to never").
export interface Database {
  public: {
    Tables: {
      prestamistas: { Row: Prestamista; Insert: Partial<Prestamista>; Update: Partial<Prestamista> };
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      clientes: { Row: Cliente; Insert: Partial<Cliente>; Update: Partial<Cliente> };
      prestamos: { Row: Prestamo; Insert: Partial<Prestamo>; Update: Partial<Prestamo> };
      cuotas: { Row: Cuota; Insert: Partial<Cuota>; Update: Partial<Cuota> };
      pagos: { Row: Pago; Insert: Partial<Pago>; Update: Partial<Pago> };
      garantias: { Row: Garantia; Insert: Partial<Garantia>; Update: Partial<Garantia> };
      configuracion_plataforma: { Row: ConfiguracionPlataforma; Insert: Partial<ConfiguracionPlataforma>; Update: Partial<ConfiguracionPlataforma> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
