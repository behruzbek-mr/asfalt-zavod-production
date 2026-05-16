import fs from 'fs';

try {
  fs.rmSync('./node_modules', { recursive: true, force: true });
  console.log("Successfully deleted node_modules");
} catch(e) {
  console.error("Failed to delete", e);
}
