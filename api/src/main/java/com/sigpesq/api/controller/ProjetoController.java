package com.sigpesq.api.controller;

import com.sigpesq.api.dto.ProjetoRequest;
import com.sigpesq.api.model.Projeto;
import com.sigpesq.api.repository.ProjetoRepository;

import jakarta.validation.Valid;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projetos")
@CrossOrigin(origins = "http://localhost:3000")
public class ProjetoController {

    private final ProjetoRepository repository;
    private static final List<String> SITUACOES_VALIDAS = List.of("Em andamento", "Concluido", "Cancelado");

    public ProjetoController(ProjetoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Projeto>> listar() {
        return ResponseEntity.ok(repository.listarTodos());
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<Projeto> buscar(@PathVariable String codigo) {
        Projeto p = repository.buscarPorCodigo(codigo);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(p);
    }

    @GetMapping("/coordenador/{cpf}")
    public ResponseEntity<List<Projeto>> listarPorCoordenador(@PathVariable String cpf) {
        return ResponseEntity.ok(repository.buscarPorCoordenador(cpf));
    }

    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody ProjetoRequest request) {
        try {
            repository.salvar(request.toModel());
            return ResponseEntity.status(HttpStatus.CREATED).body("Projeto cadastrado com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro (RN01): Já existe um projeto cadastrado com este código.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao cadastrar projeto: " + e.getMessage());
        }
    }

    @PutMapping("/{codigo}")
    public ResponseEntity<?> atualizar(@PathVariable String codigo, @Valid @RequestBody ProjetoRequest request) {
        try {
            int linhasAfetadas = repository.atualizar(codigo, request.toModel());
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Projeto atualizado com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{codigo}")
    public ResponseEntity<?> deletar(@PathVariable String codigo) {
        try {
            int linhasAfetadas = repository.deletar(codigo);
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Não é possível excluir o projeto pois existem participantes, financiamentos ou produções vinculadas a ele.");
        }
    }
}