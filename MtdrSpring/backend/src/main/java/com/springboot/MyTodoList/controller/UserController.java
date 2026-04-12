package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable UUID id) {
        try {
            return userService.getUserById(id);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping
    public ResponseEntity<User> addUser(@RequestBody User newUser) throws Exception {
        User saved = userService.addUser(newUser);
        HttpHeaders headers = new HttpHeaders();
        headers.set("location", saved.getId().toString());
        headers.set("Access-Control-Expose-Headers", "location");
        return ResponseEntity.ok().headers(headers).build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@RequestBody User user, @PathVariable UUID id) {
        try {
            User updated = userService.updateUser(id, user);
            if (updated == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteUser(@PathVariable UUID id) {
        boolean flag = userService.deleteUser(id);
        return new ResponseEntity<>(flag, flag ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }
}
