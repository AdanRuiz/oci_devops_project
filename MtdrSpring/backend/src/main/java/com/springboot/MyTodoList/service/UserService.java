package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired(required = false)
    private UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Value("${app.nodb:false}")
    private boolean noDb;

    private final java.util.concurrent.ConcurrentHashMap<Integer, User> inMemory = new java.util.concurrent.ConcurrentHashMap<>();
    private final java.util.concurrent.atomic.AtomicInteger idSeq = new java.util.concurrent.atomic.AtomicInteger(100);

    public List<User> findAll(){
        if (noDb || userRepository == null) {
            return new java.util.ArrayList<>(inMemory.values());
        }
        List<User> users = userRepository.findAll();
        return users;
    }

    public ResponseEntity<User> getUserById(int id){
        if (noDb || userRepository == null) {
            User u = inMemory.get(id);
            if (u != null) return new ResponseEntity<>(u, HttpStatus.OK);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Optional<User> userById = userRepository.findById(id);
        if (userById.isPresent()){
            return new ResponseEntity<>(userById.get(), HttpStatus.OK);
        }else{
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }


    public User addUser(User newUser){
        if (noDb || userRepository == null) {
            int id = idSeq.incrementAndGet();
            newUser.setID(id);
            inMemory.put(id, newUser);
            return newUser;
        }
        return userRepository.save(newUser);
    }

    public User test(){
        User newUser = new User(88,"someNumber","pwd");

        return userRepository.save(newUser);
    }

    public boolean deleteUser(int id){
        try{
            if (noDb || userRepository == null) {
                inMemory.remove(id);
                return true;
            }
            userRepository.deleteById(id);
            return true;
        }catch(Exception e){
            return false;
        }
    }
    public User updateUser(int id, User user2update){
        if (noDb || userRepository == null) {
            User existing = inMemory.get(id);
            if (existing == null) return null;
            existing.setPhoneNumber(user2update.getPhoneNumber());
            existing.setUserPassword(user2update.getUserPassword());
            inMemory.put(id, existing);
            return existing;
        }
        Optional<User> dbUser = userRepository.findById(id);
        if(dbUser.isPresent()){
            User user = dbUser.get();
            user.setID(id);
            user.setPhoneNumber(user2update.getPhoneNumber());
            user.setUserPassword(user2update.getUserPassword());
            return userRepository.save(user);
        }else{
            return null;
        }
    }

}
