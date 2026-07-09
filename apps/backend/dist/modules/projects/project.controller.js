import { projectService } from "./project.service.js";
import { createProjectSchema, updateProjectSchema, } from "./project.validator.js";
export class ProjectController {
    async create(req, res) {
        const authReq = req;
        const body = createProjectSchema.parse(req.body);
        const result = await projectService.create(authReq.user.userId, body);
        return res.status(201).json(result);
    }
    async findAll(req, res) {
        const authReq = req;
        const result = await projectService.findAll(authReq.user.userId);
        return res.status(200).json(result);
    }
    async update(req, res) {
        const authReq = req;
        const body = updateProjectSchema.parse(req.body);
        const result = await projectService.update(authReq.user.userId, req.params.id, body);
        return res.status(200).json(result);
    }
    async delete(req, res) {
        const authReq = req;
        const result = await projectService.delete(authReq.user.userId, req.params.id);
        return res.status(200).json(result);
    }
}
export const projectController = new ProjectController();
