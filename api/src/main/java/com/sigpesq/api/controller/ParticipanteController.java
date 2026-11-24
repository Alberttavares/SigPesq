package com.sigpesq.api.controller;

import com.sigpesq.api.dto.ParticipanteRequest;
import com.sigpesq.api.model.Participante;
import com.sigpesq.api.repository.ParticipanteRepository;

import jakarta.validation.Valid;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/participantes")
@CrossOrigin(origins = "http://localhost:3000")
public class ParticipanteController {

    private final ParticipanteRepository repository;

    public ParticipanteController(ParticipanteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<Participante>> listar() {
        return ResponseEntity.ok(repository.listarTodos());
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<Participante> buscar(@PathVariable String cpf) {
        Participante p = repository.buscarPorCpf(cpf);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(p);
    }

 @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody ParticipanteRequest request) {
        if (request.senha() == null) {
            return ResponseEntity.unprocessableEntity()
                    .body(Map.of("senha", "A senha é obrigatória."));
        }

        try {
            repository.salvar(request.toModel());
            return ResponseEntity.status(HttpStatus.CREATED).body("Participante cadastrado com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro: CPF ou E-mail institucional já cadastrado no sistema.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao cadastrar participante: " + e.getMessage());
        }
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<?> atualizar(@PathVariable String cpf, @Valid @RequestBody ParticipanteRequest request) {
        try {
            String cpfLimpo = cpf.replaceAll("\\D", "");
            int linhasAfetadas = repository.atualizar(cpfLimpo, request.toModel());
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Participante atualizado com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro: E-mail institucional já pertence a outro participante.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao atualizar participante: " + e.getMessage());
        }
    }
    @DeleteMapping("/{cpf}")
    public ResponseEntity<?> deletar(@PathVariable String cpf) {
        int linhasAfetadas = repository.deletar(cpf);
        if (linhasAfetadas == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}