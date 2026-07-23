import fs from 'fs-extra';
import path from 'path';
import { settings } from '../config/settings';

export class ReportGenerator {
  private outputDir: string;

  constructor() {
    this.outputDir = settings.get('defaultOutputDir');
  }

  async generate(title: string, content: string): Promise<string> {
    const format = settings.get('reportFormat') as string;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${title.replace(/\s+/g, '_')}_${timestamp}.${format}`;
    const filepath = path.join(this.outputDir, filename);

    await fs.ensureDir(this.outputDir);
    
    let finalContent = content;
    if (format === 'html') {
      finalContent = this.markdownToHtml(content);
    }

    await fs.writeFile(filepath, finalContent, 'utf-8');
    return filepath;
  }

  private markdownToHtml(markdown: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Research Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
${markdown.replace(/^#{1,6}\s+(.+)$/gm, '<h$1>$2</h$1>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>')
          .replace(/\n/g, '<br>')}
</body>
</html>`;
  }
}
