export class Workflow {
    definition;
    constructor(definition) {
        this.definition = definition;
    }
    get id() {
        return this.definition.metadata.id;
    }
    get name() {
        return this.definition.metadata.name;
    }
    get version() {
        return this.definition.metadata.version;
    }
}
