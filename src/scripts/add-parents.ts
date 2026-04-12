import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "src/content/encyclopedia");

const ganeshaForms = [
  "bala-ganapati.mdx",
  "taruna-ganapati.mdx",
  "bhakti-ganapati.mdx",
  "vira-ganapati.mdx",
  "shakti-ganapati.mdx",
  "dvija-ganapati.mdx",
  "siddhi-ganapati.mdx",
  "ucchishta-ganapati.mdx",
  "vighna-ganapati.mdx",
  "kshipra-ganapati.mdx",
  "heramba-ganapati.mdx",
  "lakshmi-ganapati.mdx",
  "maha-ganapati.mdx",
  "vijaya-ganapati.mdx",
  "nritya-ganapati.mdx",
  "urdhva-ganapati.mdx",
  "ekakshara-ganapati.mdx",
  "varada-ganapati.mdx",
  "tryakshara-ganapati.mdx",
  "kshipra-prasada-ganapati.mdx",
  "haridra-ganapati.mdx",
  "ekadanta-ganapati.mdx",
  "srishti-ganapati.mdx",
  "uddanda-ganapati.mdx",
  "rinamocana-ganapati.mdx",
  "dhundhi-ganapati.mdx",
  "dvimukha-ganapati.mdx",
  "trimukha-ganapati.mdx",
  "simha-ganapati.mdx",
  "yoga-ganapati.mdx",
  "durga-ganapati.mdx",
  "sankatahara-ganapati.mdx",
  "ganesha-32-manifestaties.mdx",
];

ganeshaForms.forEach((fileName) => {
  const filePath = path.join(dir, fileName);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf8");
    if (!content.includes("parent: ")) {
      content = content.replace(
        "shortDescription:",
        'parent: "ganesa"\nshortDescription:'
      );
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${fileName}`);
    }
  } else {
    console.warn(`File not found: ${fileName}`);
  }
});
