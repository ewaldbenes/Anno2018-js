const Filer = require('filer.js');

export default class FileSystem {
    private filer: any;
    constructor() {
        this.filer = new Filer();
    }

    root() {
        return this.filer.fs.root;
    }

    async init(size: number) {
        return await new Promise((resolve, reject) => this.filer.init({
            persistent: true,
            size: size,
        }, resolve, reject));
    }

    async create(filename: string|WebKitEntry) {
        return new Promise((resolve, reject) => this.filer.create(filename, false, resolve, reject));
    }

    async mkdir(foldername: string|WebKitEntry) {
        return new Promise((resolve, reject) => this.filer.mkdir(foldername, false, resolve, reject));
    }

    async ls(directory: string|WebKitEntry): Promise<WebKitFileEntry|WebKitDirectoryEntry> {
        return <Promise<WebKitFileEntry|WebKitDirectoryEntry>>new Promise((resolve, reject) => this.filer.ls(directory, resolve, reject));
    }

    async exists(entryOrPath: string|WebKitEntry) {
        try {
            await this.open(entryOrPath);
            return true;
        } catch (e) {
            return false;
        }
    }

    async open(entryOrPath: string|WebKitEntry): Promise<File> {
        return <Promise<File>>new Promise((resolve, reject) => this.filer.open(entryOrPath, resolve, reject));
    }

    async openAndGetContent(entryOrPath: string|WebKitEntry) {
        return this.getContentFromFile(await this.open(entryOrPath));
    }

    async getContentFromFile(file: File) {
        return new Promise<string>((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = (event => {
                resolve(event.target.result);
            });
            fileReader.onerror = (event => {
                reject();
            });
            fileReader.readAsText(file);
        });
    }

    async df() {
        return new Promise((resolve, reject) => {
            this.filer.df(
                (used: number, free: number, cap: number) => resolve({used: used, free: free, cap: cap}),
                reject
            );
        });
    }

    async write(pathOrEntry: string|WebKitEntry, content: any) {
        return new Promise((resolve, reject) => this.filer.write(pathOrEntry, {data: content}, resolve, reject));
    }

    async rm(pathOrEntry: string|WebKitEntry) {
        return new Promise((resolve, reject) => this.filer.rm(pathOrEntry, resolve, reject))
    }
}