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

    QModelIndex selectedIndex = this->currentIndex();
    QString selectedFilePath = model->filePath(selectedIndex);

    QTreeView::dropEvent(event);

    if (!event->isAccepted()) {
        return;
    }

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
            if (!QFileInfo(dropPath).isDir()) {
                dropPath = QFileInfo(dropPath).dir().absolutePath();
            }
        }
    } else {
        dropPath = model->rootPath();
    }

    emit dropped(dropPath, selectedFilePath);
}
