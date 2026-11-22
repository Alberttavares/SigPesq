package com.sigpesq.api.controller;

import com.sigpesq.api.dto.ProducaoCientificaRequest;
import com.sigpesq.api.model.ProducaoCientifica;
import com.sigpesq.api.repository.ProducaoCientificaRepository;

import jakarta.validation.Valid;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/producoes")
@CrossOrigin(origins = "http://localhost:3000")
public class ProducaoCientificaController {

    private final ProducaoCientificaRepository repository;

    public ProducaoCientificaController(ProducaoCientificaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<ProducaoCientifica>> listar() {
        return ResponseEntity.ok(repository.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProducaoCientifica> buscar(@PathVariable int id) {
        ProducaoCientifica pc = repository.buscarPorId(id);
        if (pc == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(pc);
    }

    @GetMapping("/projeto/{codigoProjeto}")
    public ResponseEntity<List<ProducaoCientifica>> listarPorProjeto(@PathVariable String codigoProjeto) {
        return ResponseEntity.ok(repository.buscarPorProjeto(codigoProjeto));
    }

    @PostMapping
    public ResponseEntity<?> criar( @Valid @RequestBody ProducaoCientificaRequest request) {
        try {
            repository.salvar(request.toModel());
            return ResponseEntity.status(HttpStatus.CREATED).body("Produção científica cadastrada com sucesso.");
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                    .body("Erro: O código de projeto informado não existe ou os dados excedem o limite permitido.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao cadastrar produção científica: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable int id,  @Valid @RequestBody ProducaoCientificaRequest request) {
        try {
            int linhasAfetadas = repository.atualizar(id, request.toModel());
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Produção científica atualizada com sucesso.");
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                    .body("Erro: O código de projeto informado não existe.");
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
                    .body("Não é possível excluir a produção pois existem autores vinculados a ela.");
        }
    }
}