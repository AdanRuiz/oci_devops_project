package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards pure frontend routes to index.html so React Router can handle them.
 * IMPORTANT: Only includes routes that have NO matching @RestController.
 * API paths (/projects/**, /sprints/**, /tasks/**, /users/**) must NOT be listed
 * here or Spring MVC will ambiguously route API calls to this controller.
 */
@Controller
public class SpaController {

    @RequestMapping(value = {
        "/",
        "/dashboard",
        "/kanban",
        "/kpi",
        "/profile",
        "/callback",
        "/callback/**",
        "/auth/sign-in",
        "/auth/**",
    })
    public String forward() {
        return "forward:/index.html";
    }
}
