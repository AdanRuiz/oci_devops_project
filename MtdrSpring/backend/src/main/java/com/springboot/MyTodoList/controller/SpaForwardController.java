package com.springboot.MyTodoList.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {
     @GetMapping({"/landing", "/app"})
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}