#include "n_tree_view.h"

#include <QDropEvent>
#include <QDebug>
#include <QFileSystemModel>
#include <QFileInfo>
#include <QDir>
NTreeView::NTreeView(QWidget *parent) : QTreeView(parent)
{
}

void NTreeView::dropEvent(QDropEvent *event) {
    QFileSystemModel *model = (QFileSystemModel *)this->model();

    // 選択されたファイルのパスを取得
    QModelIndex selectedIndex = this->currentIndex();
    QString selectedFilePath = model->filePath(selectedIndex);

    QTreeView::dropEvent(event);

    // ドロップが無視されたら処理を終了。例えば同じディレクトリなどにドロップした場合は無視される
    if (!event->isAccepted()) {
        return;
    }

    // ドロップされた座標からドロップされた場所のディレクトリパスを取得する
    QModelIndex dropIndex = QTreeView::indexAt(event->pos());
    switch (dropIndicatorPosition()) {
    case QAbstractItemView::AboveItem:
    case QAbstractItemView::BelowItem:
        dropIndex = dropIndex.parent();
        break;
    case QAbstractItemView::OnItem:
    case QAbstractItemView::OnViewport:
        break;
    }

    QString dropPath;
    if (dropIndex.isValid()) {
        if (dropIndex == this->rootIndex()) {
            dropPath = model->rootPath();
        } else {
            dropPath = model->filePath(dropIndex);
        }
    } else { // ドロップがModelIndexの領域外になった場合は、ルートディレクトリへのドロップである
        dropPath = model->rootPath();
    }

    emit dropped(dropPath, selectedFilePath);
}
