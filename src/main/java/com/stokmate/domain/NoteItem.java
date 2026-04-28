package com.stokmate.domain;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "note_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    @JsonIgnore
    private Note note;

    @Column(nullable = false, length = 500)
    private String content;

    @Column(nullable = false)
    private boolean isCompleted = false;

    @Column(nullable = false)
    private int position = 0; // For ordering list items
}
