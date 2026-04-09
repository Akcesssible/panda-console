import { z } from 'zod'

// ── Primitives ────────────────────────────────────────────────────────────────

const uuid = z.string().uuid({ message: 'Must be a valid UUID' })
const shortText = z.string().min(1).max(255)
const notes = z.string().max(1000).optional()

// ── Drivers ──────────────────────────────────────────────────────────────────

export const DriverActionSchema = z.object({
  driver_id: uuid,
  notes,
})

export const DriverFlagSchema = z.object({
  driver_id: uuid,
  reason: z.string().min(1, 'Reason is required').max(1000),
})

// ── Rides ─────────────────────────────────────────────────────────────────────

export const RideFlagSchema = z.object({
  ride_id: uuid,
  reason: z.string().min(1, 'Reason is required').max(1000),
})

// ── Pricing ───────────────────────────────────────────────────────────────────

export const PricingRuleSchema = z.object({
  name: shortText,
  base_fare: z.number().positive(),
  per_km_rate: z.number().nonnegative(),
  per_minute_rate: z.number().nonnegative(),
  minimum_fare: z.number().nonnegative(),
  surge_multiplier: z.number().min(1).max(10).optional(),
  zone_id: uuid.optional(),
  is_active: z.boolean().optional(),
})

// ── Settings — Roles ─────────────────────────────────────────────────────────

const PermissionMatrix = z.record(
  z.string(),
  z.object({
    create: z.boolean().optional(),
    read: z.boolean().optional(),
    update: z.boolean().optional(),
    delete: z.boolean().optional(),
    approve: z.boolean().optional(),
  }),
)

export const CreateRoleSchema = z.object({
  name: shortText,
  description: z.string().max(500).optional(),
  permissions: PermissionMatrix,
  is_active: z.boolean().optional().default(true),
})

export const UpdateRoleSchema = z.object({
  name: shortText.optional(),
  description: z.string().max(500).optional(),
  permissions: PermissionMatrix.optional(),
  is_active: z.boolean().optional(),
})

// ── Settings — Admin Users ────────────────────────────────────────────────────

export const InviteAdminUserSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  full_name: shortText,
  role: z.enum(['super_admin', 'ops_admin', 'support_agent', 'finance_viewer']),
})

export const UpdateAdminUserSchema = z.object({
  full_name: shortText.optional(),
  role: z.enum(['super_admin', 'ops_admin', 'support_agent', 'finance_viewer']).optional(),
  is_active: z.boolean().optional(),
})

// ── Settings — Zones ─────────────────────────────────────────────────────────

export const CreateZoneSchema = z.object({
  name: shortText,
  city: shortText,
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional().default(true),
})

export const UpdateZoneSchema = CreateZoneSchema.partial()

// ── Settings — System Config ──────────────────────────────────────────────────

export const UpdateConfigSchema = z.object({
  key: shortText,
  value: z.union([z.string(), z.number(), z.boolean()]),
})

// ── Support ───────────────────────────────────────────────────────────────────

export const AssignTicketSchema = z.object({
  agent_id: uuid,
})

export const TicketMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000),
})

export const ResolveTicketSchema = z.object({
  resolution_notes: z.string().max(2000).optional(),
})

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const AssignSubscriptionSchema = z.object({
  driver_id: uuid,
  plan_id: uuid,
})

export const CreateSubscriptionPlanSchema = z.object({
  name: shortText,
  price: z.number().nonnegative(),
  duration_days: z.number().int().positive(),
  features: z.array(z.string().max(255)).optional(),
  is_active: z.boolean().optional().default(true),
})

// ── Helper ────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { data } on success or a 400 NextResponse on failure.
 *
 * Usage:
 *   const result = await parseBody(request, CreateRoleSchema)
 *   if (result instanceof NextResponse) return result
 *   const { name, permissions } = result
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T> | NextResponse> {
  let raw: unknown

  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const parsed = schema.safeParse(raw)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return NextResponse.json(
      { error: 'Validation failed.', details: errors },
      { status: 400 },
    )
  }

  return parsed.data
}
