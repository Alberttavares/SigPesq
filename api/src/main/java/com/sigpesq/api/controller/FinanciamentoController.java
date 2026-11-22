package com.sigpesq.api.controller;

import com.sigpesq.api.dto.FinanciamentoRequest;

import java.util.List;
 

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sigpesq.api.model.Financiamento;
import com.sigpesq.api.repository.FinanciamentoRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/financiamentos")
@CrossOrigin(origins = "http://localhost:3000")
public class FinanciamentoController {

    private final FinanciamentoRepository repository;

    public FinanciamentoController(FinanciamentoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Financiamento>> listar() {
        return ResponseEntity.ok(repository.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Financiamento> buscar(@PathVariable int id) {
        Financiamento f = repository.buscarPorId(id);
        if (f == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(f);
    }

    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody FinanciamentoRequest request) {
        try {
            repository.salvar(request.toModel());
            return ResponseEntity.status(HttpStatus.CREATED).body("Financiamento cadastrado com sucesso.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao cadastrar financiamento: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable int id, @Valid @RequestBody FinanciamentoRequest request) {
        try {
            int linhasAfetadas = repository.atualizar(id, request.toModel());
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Financiamento atualizado com sucesso.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao atualizar financiamento: " + e.getMessage());
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable int id) {
        try {
            int linhasAfetadas = repository.deletar(id);
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Não é possível excluir o financiamento pois ele já está vinculado a um ou mais projetos.");
        }
    }
}