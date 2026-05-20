import { Document, Packer, Paragraph, TextRun } from "docx";
import * as fs from "fs";

const doc = new Document({
  sections: [
    {
      // Documents are organized into sections
      children: [
        new Paragraph({
          children: [new TextRun("Hello World!")],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("My Document.docx", buffer);
});
