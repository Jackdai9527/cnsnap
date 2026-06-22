import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "prisma", "schema.prisma");
const targetPath = path.join(root, "prisma", "schema.mysql.prisma");

const source = fs.readFileSync(sourcePath, "utf8");
const target = source.replace('provider = "sqlite"', 'provider = "mysql"');

if (source === target) {
  throw new Error('Expected prisma/schema.prisma to contain `provider = "sqlite"`.');
}

fs.writeFileSync(targetPath, target);
console.log(`Updated ${path.relative(root, targetPath)} from ${path.relative(root, sourcePath)}`);
