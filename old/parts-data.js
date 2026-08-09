// パーツデータ（全40件: 4部位 × 10種類）
// 系統順: シャーク級→ウンキウ級→ホエール級→シーラカンス級→シルドラ級（各「通常→改級」）
const partsData = {
    "艦体": [
        {name: "シャーク級艦体", cost: 5, exploration: -10, harvest: 30, surveillance: 20, range: 40, favor: 20},
        {name: "シャーク改級艦体", cost: 20, exploration: -5, harvest: 40, surveillance: 25, range: 45, favor: 35},
        {name: "ウンキウ級艦体", cost: 9, exploration: 15, harvest: 10, surveillance: 0, range: 60, favor: 15},
        {name: "ウンキウ改級艦体", cost: 20, exploration: 20, harvest: 15, surveillance: 5, range: 65, favor: 25},
        {name: "ホエール級艦体", cost: 12, exploration: -15, harvest: 55, surveillance: 35, range: 15, favor: 20},
        {name: "ホエール改級艦体", cost: 20, exploration: -10, harvest: 55, surveillance: 40, range: 20, favor: 30},
        {name: "シーラカンス級艦体", cost: 14, exploration: 40, harvest: -10, surveillance: 25, range: 40, favor: 25},
        {name: "シーラカンス改級艦体", cost: 20, exploration: 40, harvest: -5, surveillance: 30, range: 40, favor: 30},
        {name: "シルドラ級艦体", cost: 17, exploration: 10, harvest: 75, surveillance: 30, range: -15, favor: 5},
        {name: "シルドラ改級艦体", cost: 20, exploration: 10, harvest: 80, surveillance: 30, range: -15, favor: 10}
    ],
    "艦尾": [
        {name: "シャーク級艦尾", cost: 5, exploration: -30, harvest: 20, surveillance: 60, range: 30, favor: 15},
        {name: "シャーク改級艦尾", cost: 20, exploration: -25, harvest: 25, surveillance: 70, range: 35, favor: 25},
        {name: "ウンキウ級艦尾", cost: 9, exploration: 15, harvest: 0, surveillance: 30, range: 40, favor: 25},
        {name: "ウンキウ改級艦尾", cost: 20, exploration: 20, harvest: 5, surveillance: 35, range: 45, favor: 35},
        {name: "ホエール級艦尾", cost: 12, exploration: 15, harvest: 20, surveillance: 0, range: 55, favor: 15},
        {name: "ホエール改級艦尾", cost: 20, exploration: 20, harvest: 20, surveillance: 5, range: 60, favor: 20},
        {name: "シーラカンス級艦尾", cost: 14, exploration: 10, harvest: 25, surveillance: 35, range: 25, favor: 25},
        {name: "シーラカンス改級艦尾", cost: 20, exploration: 10, harvest: 25, surveillance: 40, range: 30, favor: 30},
        {name: "シルドラ級艦尾", cost: 17, exploration: 20, harvest: 60, surveillance: 35, range: -15, favor: 5},
        {name: "シルドラ改級艦尾", cost: 20, exploration: 20, harvest: 60, surveillance: 35, range: -10, favor: 10}
    ],
    "艦首": [
        {name: "シャーク級艦首", cost: 5, exploration: 50, harvest: 40, surveillance: 10, range: -20, favor: 15},
        {name: "シャーク改級艦首", cost: 20, exploration: 55, harvest: 50, surveillance: 15, range: -15, favor: 25},
        {name: "ウンキウ級艦首", cost: 9, exploration: 60, harvest: 20, surveillance: 20, range: -15, favor: 10},
        {name: "ウンキウ改級艦首", cost: 20, exploration: 65, harvest: 25, surveillance: 25, range: -10, favor: 20},
        {name: "ホエール級艦首", cost: 12, exploration: 25, harvest: 60, surveillance: -15, range: 20, favor: 15},
        {name: "ホエール改級艦首", cost: 20, exploration: 25, harvest: 65, surveillance: -10, range: 25, favor: 25},
        {name: "シーラカンス級艦首", cost: 14, exploration: 65, harvest: 10, surveillance: -10, range: 30, favor: 0},
        {name: "シーラカンス改級艦首", cost: 20, exploration: 70, harvest: 15, surveillance: -10, range: 30, favor: 5},
        {name: "シルドラ級艦首", cost: 17, exploration: 45, harvest: 30, surveillance: -15, range: 40, favor: 40},
        {name: "シルドラ改級艦首", cost: 20, exploration: 45, harvest: 30, surveillance: -10, range: 40, favor: 40}
    ],
    "艦橋": [
        {name: "シャーク級艦橋", cost: 5, exploration: 20, harvest: 20, surveillance: 20, range: 20, favor: 20},
        {name: "シャーク改級艦橋", cost: 20, exploration: 25, harvest: 25, surveillance: 30, range: 25, favor: 35},
        {name: "ウンキウ級艦橋", cost: 9, exploration: 25, harvest: 5, surveillance: 25, range: 30, favor: 30},
        {name: "ウンキウ改級艦橋", cost: 20, exploration: 30, harvest: 10, surveillance: 30, range: 35, favor: 40},
        {name: "ホエール級艦橋", cost: 12, exploration: 0, harvest: 25, surveillance: 20, range: 45, favor: 40},
        {name: "ホエール改級艦橋", cost: 20, exploration: 0, harvest: 30, surveillance: 25, range: 50, favor: 45},
        {name: "シーラカンス級艦橋", cost: 14, exploration: 55, harvest: 20, surveillance: 35, range: -15, favor: 50},
        {name: "シーラカンス改級艦橋", cost: 20, exploration: 60, harvest: 20, surveillance: 35, range: -10, favor: 55},
        {name: "シルドラ級艦橋", cost: 17, exploration: 55, harvest: 20, surveillance: -5, range: 30, favor: 60},
        {name: "シルドラ改級艦橋", cost: 20, exploration: 60, harvest: 20, surveillance: -5, range: 30, favor: 60}
    ]
};