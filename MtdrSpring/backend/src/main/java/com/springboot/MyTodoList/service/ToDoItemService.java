package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate; // Vector
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Vector
import org.springframework.ai.embedding.EmbeddingModel;

import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.time.OffsetDateTime;

import java.sql.Types;
import java.io.StringReader;

@Service
public class ToDoItemService {

    private final ToDoItemRepository toDoItemRepository;
    private final EmbeddingModel embeddingModel;
    private final JdbcTemplate jdbcTemplate;

    // Inyectamos todo por constructor (Mejor práctica en Spring)
    @Autowired
    public ToDoItemService(ToDoItemRepository repository, EmbeddingModel embeddingModel, JdbcTemplate jdbcTemplate) {
        this.toDoItemRepository = repository;
        this.embeddingModel = embeddingModel;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ToDoItem> findAll(){
        return toDoItemRepository.findAll();
    }

    public ResponseEntity<ToDoItem> getItemById(int id){
        Optional<ToDoItem> todoData = toDoItemRepository.findById(id);
        if (todoData.isPresent()){
            return new ResponseEntity<>(todoData.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public ToDoItem getToDoItemById(int id){
        return toDoItemRepository.findById(id).orElse(null);
    }
    
    @Transactional // Importante para operaciones de base de datos personalizadas
    public ToDoItem addToDoItem(ToDoItem toDoItem){
        // 1. Generar el vector
        float[] vector = embeddingModel.embed(toDoItem.getDescription());
        String vectorStr = convertVectorToString(vector);
        
        // 2. Usar JdbcTemplate en lugar del repositorio para evitar el error ORA-01461
        this.saveToDoWithVector(
            toDoItem.getDescription(), 
            OffsetDateTime.now(), 
            toDoItem.isDone(), // Usamos el valor real del objeto en vez de 'false' hardcodeado
            vectorStr
        );
        
        return toDoItem;
    }

    public boolean deleteToDoItem(int id){
        try {    
            toDoItemRepository.deleteById(id);
            return true;
        } catch(Exception e) {
            return false;
        }
    }

    public ToDoItem updateToDoItem(int id, ToDoItem td){
        Optional<ToDoItem> toDoItemData = toDoItemRepository.findById(id);
        if(toDoItemData.isPresent()){
            ToDoItem toDoItem = toDoItemData.get();
            toDoItem.setID(id);
            toDoItem.setCreation_ts(td.getCreation_ts());
            toDoItem.setDescription(td.getDescription());
            toDoItem.setDone(td.isDone());
            return toDoItemRepository.save(toDoItem);
        } else {
            return null;
        }
    }

    private String convertVectorToString(float[] vector) {
    // Arrays.toString() devuelve por defecto el formato "[1.0, 2.0, 3.0]" 
    // que es exactamente la sintaxis que Oracle 23ai exige.
        return Arrays.toString(vector);
    }

    // Método privado porque solo se usa internamente en addToDoItem
    public void saveToDoWithVector(String desc, OffsetDateTime ts, boolean done, String vectorStr) {
        String sql = "INSERT INTO TODOITEM (DESCRIPTION, CREATION_TS, DONE, INSIGHT) " +
                    "VALUES (?, ?, ?, TO_VECTOR(?))"; // Ya no necesitamos TO_CLOB aquí, Java lo enviará como CLOB nativo.
        
        jdbcTemplate.update(sql, ps -> {
            ps.setString(1, desc);
            ps.setObject(2, ts);
            ps.setBoolean(3, done);
            
            // ¡LA MAGIA OCURRE AQUÍ!
            // Al usar setClob con un StringReader, el driver de Oracle se ve obligado 
            // a transmitir el texto pesado como un CLOB sin importar su longitud.
            ps.setClob(4, new StringReader(vectorStr)); 
        });
    }
}   