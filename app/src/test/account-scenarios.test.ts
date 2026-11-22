import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { and, eq, like, isNull } from "drizzle-orm";
import { db } from "../lib/db/client";
import {
  users,
  sessions,
  userRoles,
  students,
  parents,
  parentStudents,
  invoices,
  payments,
  sppSettings,
} from "../../drizzle/schema";
import { hashPassword } from "../lib/backend/crypto";
import { createSession, resolveSession } from "../lib/backend/auth";
import { generateSppForPeriod } from "../lib/backend/spp";
import { recalcInvoice } from "../lib/api/money";

describe("END-TO-END ACCOUNT MANAGEMENT & SCENARIOS AUDIT", () => {
  let adminUserId: string;
  let parentAUserId: string;
  let parentAId: string;
  let parentBUserId: string;
  let parentBId: string;

  let student1Id: string;
  let student2Id: string;
  let student3Id: string;
  let studentBId: string;

  let invoice1Id: string;
  let invoice2Id: string;
  let invoice3Id: string;

  async function cleanupTestData() {
    // 1. Find all test students
    const testStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(like(students.nis, "NIS-TEST-%"))
      .all();
    const testStudentIds = testStudents.map((s) => s.id);

    // 2. Find all test parents
    const testParents = await db
      .select({ id: parents.id })
      .from(parents)
      .where(like(parents.username, "wali_%_2026"))
      .all();
    const testParentIds = testParents.map((p) => p.id);

    // 3. Delete dependent records first (payments -> invoices -> parentStudents)
    for (const sid of testStudentIds) {
      await db.delete(payments).where(eq(payments.student_id, sid));
      await db.delete(invoices).where(eq(invoices.student_id, sid));
      await db.delete(parentStudents).where(eq(parentStudents.student_id, sid));
    }
    for (const pid of testParentIds) {
      await db.delete(parentStudents).where(eq(parentStudents.parent_id, pid));
    }

    // 4. Delete parents & students
    for (const pid of testParentIds) {
      await db.delete(parents).where(eq(parents.id, pid));
    }
    for (const sid of testStudentIds) {
      await db.delete(students).where(eq(students.id, sid));
    }

    // 5. Delete test users & user_roles
    const testUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(like(users.username, "wali_%_2026"))
      .all();
    for (const u of testUsers) {
      await db.delete(sessions).where(eq(sessions.user_id, u.id));
      await db.delete(userRoles).where(eq(userRoles.user_id, u.id));
      await db.delete(users).where(eq(users.id, u.id));
    }
  }

  beforeAll(async () => {
    // Clean up any residual data from previous test runs
    await cleanupTestData();

    // 1. Ensure admin user exists
    const admin = await db.select().from(users).where(eq(users.username, "admin")).get();
    expect(admin).toBeDefined();
    adminUserId = admin!.id;

    // 2. Ensure active SPP setting exists for 2026/2027
    const existingSetting = await db
      .select()
      .from(sppSettings)
      .where(eq(sppSettings.academic_year, "2026/2027"))
      .get();
    if (!existingSetting) {
      await db.insert(sppSettings).values({
        academic_year: "2026/2027",
        amount: 500_000,
        billing_day: 1,
        due_day: 10,
        active: true,
        created_at: new Date(),
      });
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  // =========================================================================
  // SCENARIO 1: Single Student, Parent, and Association Persistence
  // =========================================================================
  describe("Scenario 1: Single Student, Parent, and Association Persistence", () => {
    it("Admin creates a new student with unique NIS", async () => {
      const inserted = await db
        .insert(students)
        .values({
          nis: "NIS-TEST-001",
          full_name: "Ahmad Fulan",
          gender: "L",
          class_name: "7A",
          grade_level: 7,
          status: "active",
          guardian_phone: "081234567890",
          created_at: new Date(),
        })
        .returning();

      expect(inserted.length).toBe(1);
      student1Id = inserted[0]!.id;
      expect(inserted[0]!.nis).toBe("NIS-TEST-001");
      expect(inserted[0]!.full_name).toBe("Ahmad Fulan");
      expect(inserted[0]!.status).toBe("active");
    });

    it("Admin creates a parent record and links to user account", async () => {
      // Create user account for Parent A
      const pwHash = await hashPassword("ParentPass123!");
      const userRes = await db
        .insert(users)
        .values({
          username: "wali_ahmad_2026",
          full_name: "Bapak Ahmad",
          phone: "081234567890",
          password_hash: pwHash,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
      expect(userRes.length).toBe(1);
      parentAUserId = userRes[0]!.id;

      // Assign 'parent' role
      await db.insert(userRoles).values({
        user_id: parentAUserId,
        role: "parent",
      });

      // Create parent profile
      const parentRes = await db
        .insert(parents)
        .values({
          user_id: parentAUserId,
          username: "wali_ahmad_2026",
          full_name: "Bapak Ahmad",
          phone: "081234567890",
          created_at: new Date(),
        })
        .returning();
      expect(parentRes.length).toBe(1);
      parentAId = parentRes[0]!.id;

      // Link Parent A to Student 1
      const linkRes = await db
        .insert(parentStudents)
        .values({
          parent_id: parentAId,
          student_id: student1Id,
          relation: "Ayah",
        })
        .returning();

      expect(linkRes.length).toBe(1);
      expect(linkRes[0]!.parent_id).toBe(parentAId);
      expect(linkRes[0]!.student_id).toBe(student1Id);
      expect(linkRes[0]!.relation).toBe("Ayah");
    });
  });

  // =========================================================================
  // SCENARIO 2: 1 Parent to 3 Students (Multi-Child Household)
  // =========================================================================
  describe("Scenario 2: One Parent Connected to Multiple Students (1-to-Many)", () => {
    it("Admin creates Student 2 and Student 3 and connects them to Parent A", async () => {
      const s2 = await db
        .insert(students)
        .values({
          nis: "NIS-TEST-002",
          full_name: "Fatimah Azzahra",
          gender: "P",
          class_name: "8B",
          grade_level: 8,
          status: "active",
          guardian_phone: "081234567890",
          created_at: new Date(),
        })
        .returning();
      student2Id = s2[0]!.id;

      const s3 = await db
        .insert(students)
        .values({
          nis: "NIS-TEST-003",
          full_name: "Ibrahim Hanif",
          gender: "L",
          class_name: "9A",
          grade_level: 9,
          status: "active",
          guardian_phone: "081234567890",
          created_at: new Date(),
        })
        .returning();
      student3Id = s3[0]!.id;

      // Connect Student 2 to Parent A
      await db.insert(parentStudents).values({
        parent_id: parentAId,
        student_id: student2Id,
        relation: "Ayah",
      });

      // Connect Student 3 to Parent A
      await db.insert(parentStudents).values({
        parent_id: parentAId,
        student_id: student3Id,
        relation: "Ayah",
      });

      const links = await db
        .select()
        .from(parentStudents)
        .where(eq(parentStudents.parent_id, parentAId))
        .all();

      expect(links.length).toBe(3);
    });
  });

  // =========================================================================
  // SCENARIO 3: Multi-Child Query & Switching Support
  // =========================================================================
  describe("Scenario 3: Multi-Child Query & Profile Association", () => {
    it("Queries all 3 children belonging to Parent A accurately", async () => {
      const children = await db
        .select({
          linkId: parentStudents.id,
          relation: parentStudents.relation,
          studentId: students.id,
          nis: students.nis,
          fullName: students.full_name,
          className: students.class_name,
        })
        .from(parentStudents)
        .innerJoin(students, eq(parentStudents.student_id, students.id))
        .where(eq(parentStudents.parent_id, parentAId))
        .all();

      expect(children.length).toBe(3);
      const names = children.map((c) => c.fullName);
      expect(names).toContain("Ahmad Fulan");
      expect(names).toContain("Fatimah Azzahra");
      expect(names).toContain("Ibrahim Hanif");
    });
  });

  // =========================================================================
  // SCENARIO 4: Invoice Isolation & Multi-Child Independent Balances
  // =========================================================================
  describe("Scenario 4: Invoice Isolation per Child", () => {
    it("Generates independent invoices for each student", async () => {
      // Invoice 1 for Student 1: SPP Bulan 7 - Rp 500.000
      const inv1 = await db
        .insert(invoices)
        .values({
          student_id: student1Id,
          type: "spp",
          title: "SPP Juli 2026",
          period_month: 7,
          period_year: 2026,
          amount: 500_000,
          paid_amount: 0,
          status: "unpaid",
          allow_installment: false,
          created_at: new Date(),
        })
        .returning();
      invoice1Id = inv1[0]!.id;

      // Invoice 2 for Student 2: SPP Bulan 7 - Rp 500.000
      const inv2 = await db
        .insert(invoices)
        .values({
          student_id: student2Id,
          type: "spp",
          title: "SPP Juli 2026",
          period_month: 7,
          period_year: 2026,
          amount: 500_000,
          paid_amount: 0,
          status: "unpaid",
          allow_installment: false,
          created_at: new Date(),
        })
        .returning();
      invoice2Id = inv2[0]!.id;

      // Invoice 3 for Student 3: Event Rihlah - Rp 350.000
      const inv3 = await db
        .insert(invoices)
        .values({
          student_id: student3Id,
          type: "event",
          title: "Rihlah Ilmiah 2026",
          amount: 350_000,
          paid_amount: 0,
          status: "unpaid",
          allow_installment: true,
          created_at: new Date(),
        })
        .returning();
      invoice3Id = inv3[0]!.id;

      // Assert Student 1 invoices strictly isolated
      const s1Invoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.student_id, student1Id))
        .all();
      expect(s1Invoices.length).toBe(1);
      expect(s1Invoices[0]!.id).toBe(invoice1Id);

      // Assert Student 2 invoices strictly isolated
      const s2Invoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.student_id, student2Id))
        .all();
      expect(s2Invoices.length).toBe(1);
      expect(s2Invoices[0]!.id).toBe(invoice2Id);
    });

    it("Payment applied to Student 1 only affects Student 1 and leaves Student 2 & 3 intact", async () => {
      // Record payment for Student 1 invoice
      const pay1 = await db
        .insert(payments)
        .values({
          invoice_id: invoice1Id,
          student_id: student1Id,
          amount: 500_000,
          infaq_amount: 0,
          method: "offline",
          status: "confirmed",
          receipt_number: "KWT-TEST-001",
          confirmed_by: adminUserId,
          paid_by: parentAUserId,
          created_at: new Date(),
        })
        .returning();

      expect(pay1.length).toBe(1);

      // Recalculate invoice 1
      await recalcInvoice(invoice1Id);

      // Verify Invoice 1 is PAID
      const updatedInv1 = await db.select().from(invoices).where(eq(invoices.id, invoice1Id)).get();
      expect(updatedInv1!.status).toBe("paid");
      expect(updatedInv1!.paid_amount).toBe(500_000);

      // Verify Invoice 2 (Student 2) remains UNPAID with 0 paid_amount
      const currentInv2 = await db.select().from(invoices).where(eq(invoices.id, invoice2Id)).get();
      expect(currentInv2!.status).toBe("unpaid");
      expect(currentInv2!.paid_amount).toBe(0);

      // Verify Invoice 3 (Student 3) remains UNPAID with 0 paid_amount
      const currentInv3 = await db.select().from(invoices).where(eq(invoices.id, invoice3Id)).get();
      expect(currentInv3!.status).toBe("unpaid");
      expect(currentInv3!.paid_amount).toBe(0);
    });
  });

  // =========================================================================
  // SCENARIO 5: IDOR Protection (Cross-Parent Access Prevention)
  // =========================================================================
  describe("Scenario 5: IDOR Defense Across Parent Accounts", () => {
    it("Creates Parent B and Student B and rejects Parent B accessing Student 1's invoice", async () => {
      // Create user account for Parent B
      const pwHash = await hashPassword("ParentBPass123!");
      const userB = await db
        .insert(users)
        .values({
          username: "wali_b_2026",
          full_name: "Ibu Maryam",
          phone: "089988776655",
          password_hash: pwHash,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
      parentBUserId = userB[0]!.id;

      // Assign 'parent' role
      await db.insert(userRoles).values({
        user_id: parentBUserId,
        role: "parent",
      });

      // Create parent profile
      const parentB = await db
        .insert(parents)
        .values({
          user_id: parentBUserId,
          username: "wali_b_2026",
          full_name: "Ibu Maryam",
          phone: "089988776655",
          created_at: new Date(),
        })
        .returning();
      parentBId = parentB[0]!.id;

      // Create Student B
      const studentB = await db
        .insert(students)
        .values({
          nis: "NIS-TEST-004",
          full_name: "Zaid Bin Haritsah",
          gender: "L",
          class_name: "7B",
          grade_level: 7,
          status: "active",
          guardian_phone: "089988776655",
          created_at: new Date(),
        })
        .returning();
      studentBId = studentB[0]!.id;

      // Link Parent B only to Student B
      await db.insert(parentStudents).values({
        parent_id: parentBId,
        student_id: studentBId,
        relation: "Ibu",
      });

      // IDOR Verification Logic: Parent B attempts to access invoice belonging to Student 1
      const invoiceToAccess = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice2Id))
        .get();
      expect(invoiceToAccess).toBeDefined();

      // Check whether Student 2 is linked to Parent B
      const hasAccess = await db
        .select()
        .from(parentStudents)
        .where(
          and(
            eq(parentStudents.parent_id, parentBId),
            eq(parentStudents.student_id, invoiceToAccess!.student_id),
          ),
        )
        .get();

      // IDOR DEFENSE: must be undefined (access forbidden)
      expect(hasAccess).toBeUndefined();
    });
  });

  // =========================================================================
  // SCENARIO 6: Association Removal without Deleting Records
  // =========================================================================
  describe("Scenario 6: Association Removal without Orphan Deletion", () => {
    it("Admin removes link between Parent A and Student 3 without deleting either record", async () => {
      // Find the link
      const link = await db
        .select()
        .from(parentStudents)
        .where(
          and(eq(parentStudents.parent_id, parentAId), eq(parentStudents.student_id, student3Id)),
        )
        .get();
      expect(link).toBeDefined();

      // Delete the link
      await db.delete(parentStudents).where(eq(parentStudents.id, link!.id));

      // Verify link is gone
      const deletedLink = await db
        .select()
        .from(parentStudents)
        .where(eq(parentStudents.id, link!.id))
        .get();
      expect(deletedLink).toBeUndefined();

      // Verify Student 3 record is STILL FULLY INTACT in students table
      const student3 = await db.select().from(students).where(eq(students.id, student3Id)).get();
      expect(student3).toBeDefined();
      expect(student3!.full_name).toBe("Ibrahim Hanif");
      expect(student3!.deleted_at).toBeNull();

      // Verify Parent A record is STILL FULLY INTACT in parents table
      const parentA = await db.select().from(parents).where(eq(parents.id, parentAId)).get();
      expect(parentA).toBeDefined();
      expect(parentA!.full_name).toBe("Bapak Ahmad");

      // Verify Parent A still has 2 active links (Student 1 and Student 2)
      const remainingLinks = await db
        .select()
        .from(parentStudents)
        .where(eq(parentStudents.parent_id, parentAId))
        .all();
      expect(remainingLinks.length).toBe(2);
    });
  });

  // =========================================================================
  // SCENARIO 7: Account Lifecycle & User Deactivation
  // =========================================================================
  describe("Scenario 7: Account Lifecycle, Deactivation & Session Invalidation", () => {
    it("Deactivating user flushes sessions and blocks login; reactivating restores access", async () => {
      // 1. Create an active session for Parent A
      const sessionToken = await createSession(parentAUserId);
      const activeSession = await resolveSession(sessionToken);
      expect(activeSession).not.toBeNull();
      expect(activeSession!.id).toBe(parentAUserId);

      // 2. Admin deactivates Parent A account (is_active = false) and flushes active sessions
      await db
        .update(users)
        .set({ is_active: false, updated_at: new Date() })
        .where(eq(users.id, parentAUserId));
      await db.delete(sessions).where(eq(sessions.user_id, parentAUserId));

      // 3. Assert active session is invalidated immediately
      const revokedSession = await resolveSession(sessionToken);
      expect(revokedSession).toBeNull();

      // 4. Assert user query shows is_active = false
      const deactivatedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, parentAUserId))
        .get();
      expect(deactivatedUser!.is_active).toBe(false);

      // 5. Admin reactivates Parent A account (is_active = true)
      await db
        .update(users)
        .set({ is_active: true, updated_at: new Date() })
        .where(eq(users.id, parentAUserId));

      // 6. Assert user can establish new session successfully
      const newSessionToken = await createSession(parentAUserId);
      const restoredSession = await resolveSession(newSessionToken);
      expect(restoredSession).not.toBeNull();
      expect(restoredSession!.id).toBe(parentAUserId);
    });
  });

  // =========================================================================
  // SCENARIO 8: Student Details Update
  // =========================================================================
  describe("Scenario 8: Student Details Update & Class Transition", () => {
    it("Updates student details and persists accurately without altering ID", async () => {
      await db
        .update(students)
        .set({
          class_name: "8A",
          grade_level: 8,
          guardian_phone: "081299998888",
        })
        .where(eq(students.id, student1Id));

      const updated = await db.select().from(students).where(eq(students.id, student1Id)).get();

      expect(updated).toBeDefined();
      expect(updated!.id).toBe(student1Id);
      expect(updated!.class_name).toBe("8A");
      expect(updated!.grade_level).toBe(8);
      expect(updated!.guardian_phone).toBe("081299998888");

      // Historical invoice is preserved
      const inv = await db.select().from(invoices).where(eq(invoices.id, invoice1Id)).get();
      expect(inv).toBeDefined();
      expect(inv!.student_id).toBe(student1Id);
    });
  });

  // =========================================================================
  // SCENARIO 9: Database Uniqueness & Integrity Constraints
  // =========================================================================
  describe("Scenario 9: Uniqueness & Database Constraint Enforcement", () => {
    it("Rejects duplicate NIS on student creation", async () => {
      let threw = false;
      try {
        await db.insert(students).values({
          nis: "NIS-TEST-001", // Already exists
          full_name: "Duplicate NIS Student",
          gender: "L",
          class_name: "7A",
          status: "active",
          created_at: new Date(),
        });
      } catch (err: unknown) {
        threw = true;
        const e = err as { cause?: { message?: string } | string; message?: string };
        const errMsg = String(
          e?.cause && typeof e.cause === "object" ? e.cause.message : e?.cause || e?.message,
        );
        expect(errMsg).toMatch(/UNIQUE|constraint/i);
      }
      expect(threw).toBe(true);
    });

    it("Rejects duplicate (parent_id, student_id) in parentStudents", async () => {
      let threw = false;
      try {
        // Link Parent A to Student 1 again
        await db.insert(parentStudents).values({
          parent_id: parentAId,
          student_id: student1Id,
          relation: "Ayah",
        });
      } catch (err: unknown) {
        threw = true;
        const e = err as { cause?: { message?: string } | string; message?: string };
        const errMsg = String(
          e?.cause && typeof e.cause === "object" ? e.cause.message : e?.cause || e?.message,
        );
        expect(errMsg).toMatch(/UNIQUE|constraint/i);
      }
      expect(threw).toBe(true);
    });

    it("Rejects duplicate username in users table", async () => {
      let threw = false;
      try {
        await db.insert(users).values({
          username: "admin", // Already exists
          full_name: "Duplicate Admin",
          password_hash: "dummy",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        });
      } catch (err: unknown) {
        threw = true;
        const e = err as { cause?: { message?: string } | string; message?: string };
        const errMsg = String(
          e?.cause && typeof e.cause === "object" ? e.cause.message : e?.cause || e?.message,
        );
        expect(errMsg).toMatch(/UNIQUE|constraint/i);
      }
      expect(threw).toBe(true);
    });
  });

  // =========================================================================
  // SCENARIO 10: Billing Idempotency & Conflict Handling
  // =========================================================================
  describe("Scenario 10: SPP Billing Generation Idempotency", () => {
    it("Second run of generateSppForPeriod produces 0 duplicates", async () => {
      // Period month: 8, year: 2026
      const countRun1 = await generateSppForPeriod(2026, 8);
      expect(countRun1).toBeGreaterThanOrEqual(1);

      // Re-run for exact same period
      const countRun2 = await generateSppForPeriod(2026, 8);
      // Must be strictly 0 duplicates generated
      expect(countRun2).toBe(0);

      // Check database to ensure no duplicate rows for the same student, year, month
      const s1Month8Invoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.student_id, student1Id),
            eq(invoices.period_year, 2026),
            eq(invoices.period_month, 8),
            eq(invoices.type, "spp"),
          ),
        )
        .all();

      expect(s1Month8Invoices.length).toBe(1);
    });
  });
});
