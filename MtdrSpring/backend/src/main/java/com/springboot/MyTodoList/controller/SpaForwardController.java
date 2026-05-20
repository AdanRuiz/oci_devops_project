package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {
     @GetMapping({
             "/",
             "/landing",
             "/login",
             "/app",
             "/dashboard",
             "/dashboard/**",
             "/lumi",
             "/manager"
     })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}