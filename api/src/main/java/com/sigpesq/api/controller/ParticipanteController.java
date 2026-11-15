package com.sigpesq.api.controller;

import com.sigpesq.api.model.Participante;
import com.sigpesq.api.repository.ParticipanteRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<?> criar(@RequestBody Participante participante) {
        List<String> tiposValidos = List.of("Docente", "Discente", "Técnico");
        if (participante.getTipo() == null || !tiposValidos.contains(participante.getTipo())) {
            return ResponseEntity.badRequest()
                    .body("Tipo inválido. Os valores permitidos são: Docente, Discente ou Técnico.");
        }

        try {
            repository.salvar(participante);
            return ResponseEntity.status(HttpStatus.CREATED).body("Participante cadastrado com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro: CPF ou E-mail institucional já cadastrado no sistema.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao cadastrar participante: " + e.getMessage());
        }
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<?> atualizar(@PathVariable String cpf, @RequestBody Participante participante) {
        try {
            int linhasAfetadas = repository.atualizar(cpf, participante);
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Participante atualizado com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro: E-mail institucional já está em uso por outro participante.");
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