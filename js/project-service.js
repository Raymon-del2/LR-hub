class ProjectService {
    static PROJECTS_KEY = 'lr_hub_projects';
    static ADMIN_EMAIL = 'Wambuiraymond03@gmail.com';

    static getProjects() {
        const projects = localStorage.getItem(this.PROJECTS_KEY);
        return projects ? JSON.parse(projects) : [];
    }

    static saveProject(project) {
        const projects = this.getProjects();
        project.id = Date.now().toString();
        project.createdAt = new Date().toISOString();
        project.status = 'open';
        projects.push(project);
        localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
        return project;
    }

    static getProject(id) {
        const projects = this.getProjects();
        return projects.find(p => p.id === id);
    }

    static updateProjectPart(projectId, partId, applicantEmail, audioUrl) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId);
        
        if (project) {
            const part = project.parts.find(p => p.id === partId);
            if (part) {
                part.status = 'accepted';
                part.assignedTo = applicantEmail;
                part.submissionUrl = audioUrl;
            }
            localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
        }
    }

    static isAdmin(email) {
        return email === this.ADMIN_EMAIL;
    }
}
