import { describe, expect, it } from "vitest";
import { escapeHtml, formatDate, getInitials } from "./format";

describe("format utils", () => {
    it("escapa etiquetas HTML potencialmente peligrosas", () => {
        expect(escapeHtml('<script>alert("xss")</script>')).toBe(
            "&lt;script&gt;alert(\"xss\")&lt;/script&gt;",
        );
        expect(escapeHtml(null)).toBe("");
    });

    it("obtiene máximo dos iniciales en mayúsculas", () => {
        expect(getInitials("mario mesa sosa")).toBe("MM");
        expect(getInitials("  Ana  ")).toBe("A");
        expect(getInitials("")).toBe("");
    });

    it("formatea fechas YYYY-MM-DD en español sin punto final", () => {
        const formatted = formatDate("2026-11-26");
        expect(formatted).toContain("26");
        expect(formatted).toContain("2026");
        expect(formatted).not.toContain(".");
        expect(formatDate("")).toBe("Fecha sin definir");
    });
});