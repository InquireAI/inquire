const { compileFromFile } = require("json-schema-to-typescript");
const { glob } = require("glob");
const { mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");

const retrieveFilesFromGlob = (globPattern) => {
  return new Promise((resolve, reject) => {
    glob(globPattern, (err, matches) => {
      if (err) reject(err);
      return resolve(matches);
    });
  });
};

const retrieveFileNameFromPath = (filePath) => {
  const paths = filePath.split("/");
  return paths[paths.length - 1].split(".")[0];
};

const main = async () => {
  const inputGlob = "src/**/*.json";
  const outputPath = "dist";

  const schemaFilepaths = (await retrieveFilesFromGlob(inputGlob)).reduce(
    (all, files) => all.concat(files),
    []
  );

  const typeOutput = await Promise.all(
    schemaFilepaths.map(
      (filepath) =>
        new Promise(async (resolve, reject) => {
          try {
            const types = await compileFromFile(filepath, {
              additionalProperties: false,
              cwd: join(__dirname, ".."),
              style: {
                printWidth: 100,
                tabWidth: 2,
                semi: true,
                singleQuote: true,
                trailingComma: "es5",
                jsxSingleQuote: true,
                bracketSpacing: true,
              },
            });
            resolve({
              path: filepath,
              types: types,
            });
          } catch (error) {
            reject(error);
          }
        })
    )
  );

  typeOutput.forEach((typeData) => {
    mkdirSync(outputPath, {
      recursive: true,
    });
    writeFileSync(
      `${outputPath}/${retrieveFileNameFromPath(typeData.path)}.d.ts`,
      typeData.types
    );
  });
};

main();
