/** @file Generate the deliverable PDF from docs/lab-report.md via pandoc and Playwright. */
import { execFile as execFileCallback } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';

const execFile = promisify(execFileCallback);
const reportHtml = resolve('docs/lab-report.html');
const pdfPath = resolve(
  'docs/individual-lab-week-6-diego-alejandro-botina-software-development-4.pdf',
);

/**
 * Converts the Spanish Markdown report into an HTML document using pandoc.
 *
 * @returns {Promise<void>} Resolves after pandoc writes the standalone HTML.
 * @throws {Error} If pandoc is unavailable or exits unsuccessfully.
 */
async function renderReportHtml() {
  const args = [
    'docs/lab-report.md',
    '-o',
    'docs/lab-report.html',
    '--standalone',
    '--embed-resources',
    '--resource-path=docs',
    '--css=scripts/pdf-style.css',
    '--metadata',
    'title=Laboratorio Semana 6 — Actividad #2',
    '--metadata',
    'author=Diego Alejandro Botina',
    '--metadata',
    'lang=es',
  ];

  try {
    await execFile('pandoc', args, { cwd: resolve('.') });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error('Pandoc is not installed or is not available on PATH.');
    }

    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Pandoc failed to render docs/lab-report.md: ${detail}`);
  }
}

/**
 * Renders the generated HTML document as an A4 PDF in Chromium.
 *
 * @returns {Promise<void>} Resolves after the PDF is written.
 */
async function renderPdf() {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(pathToFileURL(reportHtml).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '22mm', right: '18mm', bottom: '22mm', left: '18mm' },
    });
  } finally {
    await browser.close();
  }
}

/**
 * Generates and reports the size of the deliverable PDF.
 *
 * @returns {Promise<void>} Resolves after generation and temporary-file cleanup.
 */
async function main() {
  try {
    await renderReportHtml();
    await renderPdf();
    const { size } = await fs.stat(pdfPath);
    process.stdout.write(
      `Generated docs/individual-lab-week-6-diego-alejandro-botina-software-development-4.pdf (${(size / 1024).toFixed(1)} KB).\n`,
    );
  } finally {
    await fs.rm(reportHtml, { force: true });
  }
}

main().catch((error) => {
  process.stderr.write(
    `PDF generation failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
