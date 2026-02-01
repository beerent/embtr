import { describe, it, expect } from 'vitest';
import { getMenuSections } from '../SideMenu';

describe('getMenuSections', () => {
    it('returns Main section for regular users', () => {
        const sections = getMenuSections('user');
        const titles = sections.map((s) => s.title);
        expect(titles).toContain('Main');
    });

    it('excludes Admin section for regular users', () => {
        const sections = getMenuSections('user');
        const titles = sections.map((s) => s.title);
        expect(titles).not.toContain('Admin');
    });

    it('includes Admin section for admins', () => {
        const sections = getMenuSections('admin');
        const titles = sections.map((s) => s.title);
        expect(titles).toContain('Admin');
    });

    it('includes Main section for admins', () => {
        const sections = getMenuSections('admin');
        const titles = sections.map((s) => s.title);
        expect(titles).toContain('Main');
    });

    it('Admin section contains Users page', () => {
        const sections = getMenuSections('admin');
        const adminSection = sections.find((s) => s.title === 'Admin');
        const paths = adminSection!.items.map((i) => i.path);
        expect(paths).toContain('/users');
    });

    it('Admin section contains Challenges manage page', () => {
        const sections = getMenuSections('admin');
        const adminSection = sections.find((s) => s.title === 'Admin');
        const paths = adminSection!.items.map((i) => i.path);
        expect(paths).toContain('/challenges/manage');
    });

    it('Main section contains Challenges page', () => {
        const sections = getMenuSections('user');
        const mainSection = sections.find((s) => s.title === 'Main');
        const paths = mainSection!.items.map((i) => i.path);
        expect(paths).toContain('/challenges');
    });

    it('Main section does not contain Users page', () => {
        const sections = getMenuSections('admin');
        const mainSection = sections.find((s) => s.title === 'Main');
        const paths = mainSection!.items.map((i) => i.path);
        expect(paths).not.toContain('/users');
    });

    it('excludes Admin section for unknown roles', () => {
        const sections = getMenuSections('moderator');
        const titles = sections.map((s) => s.title);
        expect(titles).not.toContain('Admin');
    });

    it('excludes Admin section for empty string role', () => {
        const sections = getMenuSections('');
        const titles = sections.map((s) => s.title);
        expect(titles).not.toContain('Admin');
        expect(titles).toContain('Main');
    });

    it('does not expose /users path to non-admin in any section', () => {
        const sections = getMenuSections('user');
        const allPaths = sections.flatMap((s) => s.items.map((i) => i.path));
        expect(allPaths).not.toContain('/users');
    });

    it('non-admin sections do not have adminOnly flag', () => {
        const sections = getMenuSections('user');
        expect(sections.every((s) => !s.adminOnly)).toBe(true);
    });
});
