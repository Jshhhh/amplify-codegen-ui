/*
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */
import { ImportDeclaration, factory } from 'typescript';
import path from 'path';
import { ImportMapping, ImportValue, ImportSource } from './import-mapping';

export class ImportCollection {
  #collection: Map<string, Set<string>> = new Map();

  addMappedImport(importValue: ImportValue) {
    const importPackage = ImportMapping[importValue];
    this.addImport(importPackage, importValue);
  }

  addImport(packageName: string, importName: string) {
    if (!this.#collection.has(packageName)) {
      this.#collection.set(packageName, new Set());
    }

    const existingPackage = this.#collection.get(packageName);

    if (!existingPackage?.has(importName)) {
      existingPackage?.add(importName);
    }
  }

  removeImportSource(packageImport: ImportSource) {
    this.#collection.delete(packageImport);
  }

  mergeCollections(otherCollection: ImportCollection) {
    otherCollection.#collection.forEach((value, key) => {
      [...value].forEach((singlePackage) => {
        this.addImport(key, singlePackage);
      });
    });
  }

  buildSampleSnippetImports(topComponentName: string): ImportDeclaration[] {
    return [
      factory.createImportDeclaration(
        undefined,
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(undefined, factory.createIdentifier(topComponentName)),
          ]),
        ),
        factory.createStringLiteral('./ui-components'),
      ),
    ];
  }

  buildImportStatements(skipReactImport?: boolean): ImportDeclaration[] {
    const importDeclarations = ([] as ImportDeclaration[])
      .concat(
        skipReactImport
          ? []
          : [
              factory.createImportDeclaration(
                undefined,
                undefined,
                factory.createImportClause(
                  false,
                  undefined,
                  factory.createNamespaceImport(factory.createIdentifier('React')),
                ),
                factory.createStringLiteral('react'),
              ),
            ],
      )
      .concat(
        Array.from(this.#collection).map(([moduleName, imports]) => {
          const namedImports = [...imports].filter((namedImport) => namedImport !== 'default').sort();
          return factory.createImportDeclaration(
            undefined,
            undefined,
            factory.createImportClause(
              false,
              // use module name as defualt import name
              [...imports].indexOf('default') >= 0 ? factory.createIdentifier(path.basename(moduleName)) : undefined,
              factory.createNamedImports(
                namedImports.map((item) => {
                  return factory.createImportSpecifier(undefined, factory.createIdentifier(item));
                }),
              ),
            ),
            factory.createStringLiteral(moduleName),
          );
        }),
      );

    return importDeclarations;
  }
}
