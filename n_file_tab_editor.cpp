#include "n_file_tab_editor.h"
#include "n_util.h"
#include "ui_n_file_tab_editor.h"

#include <QDebug>
#include <QDir>
#include <QFileSystemModel>
#include <QFile>
#include <QInputDialog>
#include <QMessageBox>
#include <QMenu>
#include <QFileDialog>

NFileTabEditor::NFileTabEditor(QWidget *parent) : QWidget(parent)
{
}

void NFileTabEditor::init(NTreeView *fileTreeView, QTabWidget *fileTabWidget) {
    mFileTreeView = fileTreeView;
    mFileTabWidget = fileTabWidget;
    mProjectDir = new QDir(QDir::homePath());

    mFileSysteMmodel = new QFileSystemModel;
    mFileSysteMmodel->setReadOnly(false);
    mFileTreeView->setModel(mFileSysteMmodel);
    mFileTreeView->hideColumn(1);
    mFileTreeView->hideColumn(2);
    mFileTreeView->hideColumn(3);
    mFileTreeView->hideColumn(4);

    connect(mFileTreeView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(mFileTreeView, SIGNAL(doubleClicked(QModelIndex)), this, SLOT(openFile(QModelIndex)));
    connect(mFileTreeView, SIGNAL(dropped(QString,QString)), this, SLOT(updateTabForDropped(QString,QString)));
    connect(mFileTabWidget, SIGNAL(tabCloseRequested(int)), this, SLOT(closeFile(int)));
}

void NFileTabEditor::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    QString rootDirPath = mProjectDir->absoluteFilePath(mRootDirName);
    mFileSysteMmodel->setRootPath(rootDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    mFileTreeView->setRootIndex(mFileSysteMmodel->index(rootDirPath));

    mFileTabWidget->clear();
}

QList<int> NFileTabEditor::searchTabIndexesByPath(const QString &path, const bool &isDir) {
    QList<int> indexes;

    if (isDir) {
        int tabNum = mFileTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            QWidget *widget = mFileTabWidget->widget(i);
            QString filePath = widget->objectName();
            if (filePath.indexOf(path) == 0) {
                indexes.append(i);
            }
        }
    } else {
        int tabNum = mFileTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            QWidget *widget = mFileTabWidget->widget(i);
            QString filePath = widget->objectName();
            if (QString::compare(path, filePath) == 0) {
                indexes.append(i);
            }
        }
    }

    return indexes;
}

void NFileTabEditor::updateTabForPathChanged(const QString &oldPath, const QString &newPath) {
    QFileInfo newPathInfo(newPath);
    QList<int> indexes  = searchTabIndexesByPath(oldPath, newPathInfo.isDir());

    for (int i = 0; i < indexes.length(); i++) {
        int index = indexes[i];
        QWidget *widget = mFileTabWidget->widget(index);
        QString filePath = widget->objectName();
        filePath = newPath + filePath.remove(0, oldPath.length());
        widget->setObjectName(filePath);

        QString oldTabText = mFileTabWidget->tabText(index);
        if (oldTabText[oldTabText.length() - 1] == '*') {
            mFileTabWidget->setTabText(index, QFileInfo(filePath).fileName() + "*");
        } else {
            mFileTabWidget->setTabText(index, QFileInfo(filePath).fileName());
        }
    }
}

void NFileTabEditor::updateTabForDropped(QString dropDirPath, QString selectedFilePath) {
    QString fileName = QFileInfo(selectedFilePath).fileName();
    QString newFilePath = QDir(dropDirPath).absoluteFilePath(fileName);

    updateTabForPathChanged(selectedFilePath, newFilePath);
}

void NFileTabEditor::updateTabForPathDeleted(const QString &path, const bool &isDir) {
    QList<int> indexes = searchTabIndexesByPath(path, isDir);

    for (int i = 0; i < indexes.length(); i++) {
        mFileTabWidget->removeTab(indexes[i]);
    }
}

void NFileTabEditor::updateTabForCurrentFileContentChanged() {
    int tabIndex = mFileTabWidget->currentIndex();
    QString tabText = mFileTabWidget->tabText(tabIndex);

    if (tabText[tabText.length() - 1] != '*') {
        mFileTabWidget->setTabText(tabIndex, tabText + "*");
    }
}

bool NFileTabEditor::isFileContentChanged(int tabIndex) {
    // 内容が編集されているものはタブ名の末尾がアスタリスクとなる
    // もうちょっとちゃんと管理したほうがよいQMap<QWidget *, bool>のような感じで
    QString tabName = mFileTabWidget->tabText(tabIndex);
    if (tabName[tabName.length() - 1] == '*') {
        return true;
    } else {
        return false;
    }
}

void NFileTabEditor::openFile(QModelIndex index) {
    QString filePath = ((QFileSystemModel *) mFileTreeView->model())->filePath(index);
    QList<int> tabIndexes = searchTabIndexesByPath(filePath, false);

    // already open tab for file path;
    if (tabIndexes.length() > 0) {
        mFileTabWidget->setCurrentIndex(tabIndexes[0]);
        return;
    }

    QWidget *widget = createTabWidget(filePath);
    if (widget == NULL) {
        return;
    }

    QString fileName = QFileInfo(filePath).fileName();
    widget->setObjectName(filePath);
    int tabIndex = mFileTabWidget->addTab(widget, fileName);
    mFileTabWidget->setCurrentIndex(tabIndex);
}

void NFileTabEditor::closeFile(int tabIndex) {
    if (!isFileContentChanged(tabIndex)) {
        mFileTabWidget->removeTab(tabIndex);
        return;
    }

    int ret = QMessageBox::question(this, tr("save file"), tr("do you save this file?"));
    if (ret == QMessageBox::Yes) {
        bool ret = saveFile(tabIndex);
        if (ret) {
            mFileTabWidget->removeTab(tabIndex);
        }
        return;
    }
}

bool NFileTabEditor::saveFile(int tabIndex) {
    if (!isFileContentChanged(tabIndex)) {
        return true;
    }

    QWidget *widget = mFileTabWidget->widget(tabIndex);
    QString filePath = widget->objectName();
    QFile file(filePath);

    QString editedFileContent = this->editedFileContent(widget);

    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail open file.") + "\n" + filePath);
        return false;
    }
    int ret = file.write(editedFileContent.toUtf8());
    if (ret == -1) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail save file.") + "\n" + filePath);
        return false;
    }

    // 保存が完了したのでタブ名の*を取り除く
    QString tabName = mFileTabWidget->tabText(tabIndex);
    mFileTabWidget->setTabText(tabIndex, tabName.remove(tabName.length() - 1, 1));

    return true;
}

void NFileTabEditor::saveAllFile() {
    int openFileNum = mFileTabWidget->count();
    for (int i = 0; i < openFileNum; i++) {
        saveFile(i);
    }
}

void NFileTabEditor::newFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newFile(parentPath, fileName, mFileExtension);
}

void NFileTabEditor::newDir() {
    QString dirName = QInputDialog::getText(this, tr("New Directory"), tr("create new directory"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newDir(parentPath, dirName);
}

void NFileTabEditor::importPath() {
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), mImportFileExtension);

    QString parentPath = NUtil::selectedPath(mFileTreeView);
    for (int i = 0; i < files.length(); i++) {
        NUtil::importFile(parentPath, files[i]);
    }
}

void NFileTabEditor::deletePath() {
    QString path = NUtil::selectedPath(mFileTreeView);
    bool isDir = QFileInfo(path).isDir();
    bool ret = NUtil::deletePath(path);

    if (ret) {
        updateTabForPathDeleted(path, isDir);
    }
}

void NFileTabEditor::renamePath() {
    QString newName = QInputDialog::getText(this, tr("Rename File"), tr("enter new name"));
    QString srcPath = NUtil::selectedPath(mFileTreeView);
    QString ext = QFileInfo(srcPath).suffix();
    QString newPath = NUtil::renamePath(srcPath, newName, ext);

    if (newPath.isEmpty()) {
        return;
    }

    updateTabForPathChanged(srcPath, newPath);
}

void NFileTabEditor::copyPath() {
    QString newName = QInputDialog::getText(this, tr("Copy File"), tr("enter copy name"));
    QString srcPath = NUtil::selectedPath(mFileTreeView);
    QString ext = QFileInfo(srcPath).suffix();
    NUtil::copyPath(srcPath, newName, ext);
}

void NFileTabEditor::contextMenu(QPoint point) {
    QMenu menu(this);

    QMenu *subMenu = menu.addMenu(tr("&New"));
    if (!mContextNewFileLabel.isEmpty()) {
        subMenu->addAction(mContextNewFileLabel, this, SLOT(newFile()));
    }
    subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));
    menu.addAction(tr("&Import"), this, SLOT(importPath()));

    menu.addSeparator();
    QAction *renameAction = menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
    QAction *copyAction = menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
    QAction *deleteAction = menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

    // 選択された場所が何もないところだったら、rootを選択したものとみなす
    QModelIndex index = mFileTreeView->indexAt(point);
    if (!index.isValid()) {
        mFileTreeView->setCurrentIndex(mFileTreeView->rootIndex());
        mFileTreeView->clearSelection();

        renameAction->setDisabled(true);
        copyAction->setDisabled(true);
        deleteAction->setDisabled(true);
    }

    menu.exec(QCursor::pos());

}

NFileTabEditor::~NFileTabEditor()
{
}
