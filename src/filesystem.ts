import Stream from "./parsers/stream";
import { uInt8ToBase64 } from "./util/util";

const Filer = require("filer.js");

export default class FileSystem {
  private filer: any;
  constructor() {
    this.filer = new Filer();
  }

  public async init(size: number) {
    return new Promise((resolve, reject) =>
      this.filer.init(
        {
          persistent: true,
          size: size
        },
        resolve,
        reject
      )
    );
  }

  public async create(filename: string | WebKitEntry) {
    return new Promise((resolve, reject) =>
      this.filer.create(filename, false, resolve, reject)
    );
  }

  public async mkdir(foldername: string | WebKitEntry) {
    return new Promise((resolve, reject) =>
      this.filer.mkdir(foldername, false, resolve, reject)
    );
  }

  public async ls(
    directory: string | WebKitEntry,
    filterByExtensions?: string
  ): Promise<WebKitEntry[]> {
    const entries = await (new Promise((resolve, reject) => {
      this.filer.ls(directory, resolve, reject);
    }) as Promise<WebKitEntry[]>);

    if (!filterByExtensions) {
      return entries;
    }

    const extensions = filterByExtensions.split("|");
    return entries.filter((entry: WebKitEntry) => {
      return (
        entry.isFile &&
        extensions.some(extension => entry.name.endsWith(extension))
      );
    });
  }

  public async exists(entryOrPath: string | WebKitEntry) {
    let path: string;
    if ((entryOrPath as WebKitEntry).fullPath) {
      path = (entryOrPath as WebKitEntry).fullPath;
    } else {
      path = entryOrPath as string;
    }
    if (!path.startsWith("/")) {
      throw new Error(
        `exists() only works with absolute paths, "${path}" given.`
      );
    }
    const parts = path.split("/").filter(part => part !== "");
    path = "";
    for (const part of parts) {
      path += "/";
      const entries = await this.ls(path);
      path += part;
      if (entries.find(entry => entry.fullPath === path) === undefined) {
        return false;
      }
    }
    return true;
  }

  public async open(entryOrPath: string | WebKitEntry): Promise<File> {
    return new Promise((resolve, reject) =>
      this.filer.open(entryOrPath, resolve, reject)
    ) as Promise<File>;
  }

  public async openAndGetContentAsText(entryOrPath: string | WebKitEntry) {
    return this.getTextContentFromFile(await this.open(entryOrPath));
  }

  public async openAndGetContentAsStream(
    entryOrPath: string | WebKitEntry
  ): Promise<Stream> {
    return new Stream(
      await this.getUint8ContentFromFile(await this.open(entryOrPath))
    );
  }

  public async openAndGetContentAsUint8Array(
    entryOrPath: string | WebKitEntry
  ): Promise<Uint8Array> {
    return this.getUint8ContentFromFile(await this.open(entryOrPath));
  }

  public async getTextContentFromFile(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = event => {
        if (fileReader.result !== null) {
          resolve(fileReader.result as string);
        } else {
          reject();
        }
      };
      fileReader.onerror = event => {
        reject();
      };
      fileReader.readAsText(file);
    });
  }

  public async getUint8ContentFromFile(file: File): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = event => {
        if (fileReader.result !== null) {
          resolve(new Uint8Array(fileReader.result as ArrayBuffer));
        } else {
          reject();
        }
      };
      fileReader.onerror = event => {
        reject();
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  public async df() {
    return new Promise((resolve, reject) => {
      this.filer.df(
        (used: number, free: number, cap: number) =>
          resolve({ used: used, free: free, cap: cap }),
        reject
      );
    });
  }

  public async write(pathOrEntry: string | WebKitEntry, content: any) {
    return new Promise((resolve, reject) =>
      this.filer.write(pathOrEntry, { data: content }, resolve, reject)
    );
  }

  public async rm(pathOrEntry: string | WebKitEntry) {
    return new Promise((resolve, reject) =>
      this.filer.rm(pathOrEntry, resolve, reject)
    );
  }

  public async rmRoot() {
    const entries = await this.ls("/");
    return Promise.all(entries.map(entry => this.rm(entry.fullPath)));
  }

  public async download(pathOrEntry: string | WebKitEntry) {
    let files;
    try {
      files = await this.ls(pathOrEntry);
    } catch (e) {
      return this.downloadFile(pathOrEntry);
    }
    return this.downloadDirectory(files);
  }

  private async downloadFile(pathOrEntry: string | WebKitEntry) {
    const fileName =
      typeof pathOrEntry === "string" ? pathOrEntry : pathOrEntry.fullPath;

    const content = await this.openAndGetContentAsUint8Array(pathOrEntry);
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:application/json;base64,${uInt8ToBase64(content)}`
    );
    element.setAttribute("download", fileName);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  private async downloadDirectory(files: WebKitEntry[]) {
    for (const file of files) {
      await this.download(file);
    }
  }
}
