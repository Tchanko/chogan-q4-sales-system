import { describe, expect, it } from "vitest";
import { normalizeWhatsApp } from "@/lib/validation/phone";
import {
  attributionSchema,
  leadFormSchema,
  registrationFormSchema,
  toFieldErrors,
  unsubscribeFormSchema,
} from "@/lib/validation/schemas";
import { validLead, validRegistration } from "./helpers";

describe("numéro WhatsApp", () => {
  it.each([
    ["06 12 34 56 78", "FR", "+33612345678"],
    ["+33 6 12 34 56 78", "CI", "+33612345678"],
    ["0033612345678", "BE", "+33612345678"],
    ["07 07 12 34 56", "CI", "+2250707123456"],
    ["0470 12 34 56", "BE", "+32470123456"],
  ])("normalise %s (%s) en %s", (raw, country, expected) => {
    expect(normalizeWhatsApp(raw, country)).toBe(expected);
  });

  it.each([["123"], ["06 12"], ["abc def ghi"], ["+33 6 12 34 56 78 99 99"], ["<script>"]])(
    "refuse %s",
    (raw) => {
      expect(normalizeWhatsApp(raw, "FR")).toBeNull();
    },
  );
});

describe("formulaire de capture", () => {
  it("accepte une saisie valide sans e-mail", () => {
    expect(leadFormSchema.safeParse(validLead).success).toBe(true);
  });

  it("exige le consentement explicite", () => {
    const r = leadFormSchema.safeParse({ ...validLead, consent: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(toFieldErrors(r.error).consent).toMatch(/consentement/);
  });

  it("signale chaque champ invalide avec un message en français", () => {
    const r = leadFormSchema.safeParse({
      firstName: "A",
      email: "pas-un-email",
      phoneCountry: "FR",
      phone: "12",
      challenge: "inconnue",
      consent: true,
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    const errors = toFieldErrors(r.error);
    expect(errors.firstName).toMatch(/prénom/);
    expect(errors.email).toMatch(/e-mail/);
    expect(errors.challenge).toMatch(/difficulté/);
    expect(errors.phone).toMatch(/WhatsApp/);
  });

  it("refuse les caractères spéciaux dans le prénom", () => {
    expect(leadFormSchema.safeParse({ ...validLead, firstName: "<b>Awa</b>" }).success).toBe(false);
  });

  it("accepte les prénoms accentués et composés", () => {
    expect(leadFormSchema.safeParse({ ...validLead, firstName: "Marie-Hélène" }).success).toBe(true);
  });
});

describe("demande d'inscription", () => {
  it("accepte une saisie valide", () => {
    expect(registrationFormSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("exige l'acceptation des conditions de vente", () => {
    const r = registrationFormSchema.safeParse({ ...validRegistration, consentTerms: false });
    expect(r.success).toBe(false);
  });

  it("refuse un moyen de paiement non proposé", () => {
    for (const paymentMethod of ["carte", "autre"]) {
      expect(registrationFormSchema.safeParse({ ...validRegistration, paymentMethod }).success).toBe(false);
    }
  });

  it("accepte les 3 moyens de paiement retenus", () => {
    for (const paymentMethod of ["virement", "paypal", "mobile_money"]) {
      expect(registrationFormSchema.safeParse({ ...validRegistration, paymentMethod }).success).toBe(true);
    }
  });

  it("refuse un pays inconnu", () => {
    const r = registrationFormSchema.safeParse({ ...validRegistration, country: "ZZ" });
    expect(r.success).toBe(false);
  });
});

describe("désinscription", () => {
  it("exige au moins un contact", () => {
    const r = unsubscribeFormSchema.safeParse({ email: "", phone: "", phoneCountry: "FR" });
    expect(r.success).toBe(false);
  });

  it("accepte un e-mail seul", () => {
    const r = unsubscribeFormSchema.safeParse({ email: "a@b.fr", phone: "", phoneCountry: "FR" });
    expect(r.success).toBe(true);
  });
});

describe("attribution", () => {
  it("ignore les valeurs malformées sans bloquer l'envoi", () => {
    const r = attributionSchema.parse({
      utmSource: "facebook",
      referrerHost: "https://evil.example/path",
      landingPath: "javascript:alert(1)",
    });
    expect(r.utmSource).toBe("facebook");
    expect(r.referrerHost).toBeNull();
    expect(r.landingPath).toBeNull();
  });
});
