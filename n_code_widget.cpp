#include "n_code_widget.h"
#include "ui_n_code_widget.h"
#include "n_util.h"

#include <QFileSystemModel>
#include <QDebug>
#include <QTextEdit>
#include <QMenu>
#include <QInputDialog>
#include <QMessageBox>
#include <QFileSystemWatcher>

NCodeWidget::NCodeWidget(QWidget *parent) : QWidget(parent), ui(new Ui::NCodeWidget)
{
    ui->setupUi(this);
    mProjectDir = new QDir(QDir::homePath());

    mFileSysteMmodel = new QFileSystemModel;
    mFileSysteMmodel->setReadOnly(false);
    ui->fileTreeView->setModel(mFileSysteMmodel);
    ui->fileTreeView->hideColumn(1);
    ui->fileTreeView->hideColumn(2);
    ui->fileTreeView->hideColumn(3);
    ui->fileTreeView->hideColumn(4);
}

void NCodeWidget::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    QString codeDirPath = mProjectDir->absoluteFilePath("code");
    mFileSysteMmodel->setRootPath(codeDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    ui->fileTreeView->setRootIndex(mFileSysteMmodel->index(codeDirPath));

    ui->fileTabWidget->clear();
}

bool NCodeWidget::isTextChanged(int tabIndex) {
    // 内容が編集されているものはタブ名の末尾がアスタリスクとなる
    QString tabName = ui->fileTabWidget->tabText(tabIndex);
    if (tabName[tabName.length() - 1] == '*') {
        return true;
    } else {
        return false;
    }
}

bool NCodeWidget::saveFile(int tabIndex) {
    if (!isTextChanged(tabIndex)) {
        return true;
    }

    QTextEdit *edit = (QTextEdit *)ui->fileTabWidget->widget(tabIndex);
    QString text = edit->toPlainText();
    QString filePath = edit->objectName();
    QFile file(filePath);
    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail open file.") + "\n" + filePath);
        return false;
    }
    int ret = file.write(text.toUtf8());
    if (ret == -1) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail save file.") + "\n" + filePath);
        return false;
    }

    // 保存が完了したのでタブ名の*を取り除く
    QString tabName = ui->fileTabWidget->tabText(tabIndex);
    ui->fileTabWidget->setTabText(tabIndex, tabName.remove(tabName.length() - 1, 1));

    return true;
}

void NCodeWidget::saveAllFile() {
    int editingCodeNum = ui->fileTabWidget->count();
    for (int i = 0; i < editingCodeNum; i++) {
        saveFile(i);
    }
}

void NCodeWidget::openFile(QModelIndex index) {
    QString filePath = ((QFileSystemModel *) ui->fileTreeView->model())->filePath(index);
    QList<int> tabIndexes = searchTabIndexesByPath(filePath, false);

    // already open tab for file path;
    if (tabIndexes.length() > 0) {
        ui->fileTabWidget->setCurrentIndex(tabIndexes[0]);
        return;
    }

    QFile file(filePath);
    QString fileName = QFileInfo(filePath).fileName();

    if(!file.open(QFile::ReadOnly | QFile::Text)){
        return;
    }

    QTextEdit *textEdit = new QTextEdit();
    textEdit->setObjectName(filePath);
    textEdit->setText(file.readAll());
    file.close();
    int tabIndex = ui->fileTabWidget->addTab(textEdit, fileName);
    ui->fileTabWidget->setCurrentIndex(tabIndex);

    connect(textEdit, SIGNAL(textChanged()), this, SLOT(updateTabForTextChanged()));
}

void NCodeWidget::closeFile(int tabIndex) {
    if (!isTextChanged(tabIndex)) {
        ui->fileTabWidget->removeTab(tabIndex);
        return;
    }

    int ret = QMessageBox::question(this, tr("save file"), tr("do you save this file?"));
    if (ret == QMessageBox::Yes) {
        bool ret = saveFile(tabIndex);
        if (ret) {
            ui->fileTabWidget->removeTab(tabIndex);
        }
        return;
    }
}

void NCodeWidget::updateTabForTextChanged() {
    int tabIndex = ui->fileTabWidget->currentIndex();
    QString tabText = ui->fileTabWidget->tabText(tabIndex);

    if (tabText[tabText.length() - 1] != '*') {
        ui->fileTabWidget->setTabText(tabIndex, tabText + "*");
    }
}

void NCodeWidget::updateTabForPathChanged(const QString &oldPath, const QString &newPath) {
    QFileInfo newPathInfo(newPath);
    QList<int> indexes  = searchTabIndexesByPath(oldPath, newPathInfo.isDir());

    for (int i = 0; i < indexes.length(); i++) {
        int index = indexes[i];
        QTextEdit *edit = (QTextEdit *)ui->fileTabWidget->widget(index);
        QString filePath = edit->objectName();
        filePath = newPath + filePath.remove(0, oldPath.length());
        edit->setObjectName(filePath);

        ui->fileTabWidget->setTabText(index, QFileInfo(filePath).fileName());
    }
}

void NCodeWidget::updateTabForDropped(QString dropDirPath, QString selectedFilePath) {
    QString fileName = QFileInfo(selectedFilePath).fileName();
    QString newFilePath = QDir(dropDirPath).absoluteFilePath(fileName);

    updateTabForPathChanged(selectedFilePath, newFilePath);
}

void NCodeWidget::updateTabForPathDeleted(const QString &path, const bool &isDir) {
    QList<int> indexes = searchTabIndexesByPath(path, isDir);

    for (int i = 0; i < indexes.length(); i++) {
        ui->fileTabWidget->removeTab(indexes[i]);
    }
}

QList<int> NCodeWidget::searchTabIndexesByPath(const QString &path, const bool &isDir) {
    QList<int> indexes;

    if (isDir) {
        int tabNum = ui->fileTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            QTextEdit *edit = (QTextEdit *)ui->fileTabWidget->widget(i);
            QString filePath = edit->objectName();
            if (filePath.indexOf(path) == 0) {
                indexes.append(i);
            }
        }
    } else {
        int tabNum = ui->fileTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            QTextEdit *edit = (QTextEdit *)ui->fileTabWidget->widget(i);
            QString filePath = edit->objectName();
            if (QString::compare(path, filePath) == 0) {
                indexes.append(i);
            }
        }
    }

    return indexes;
}

void NCodeWidget::contextMenu(QPoint point) {
    // 選択された場所が何もないところだったら、rootを選択したものとみなす
    QModelIndex index = ui->fileTreeView->indexAt(point);
    if (!index.isValid()) {
        ui->fileTreeView->setCurrentIndex(ui->fileTreeView->rootIndex());
        ui->fileTreeView->clearSelection();
    }

    QMenu menu(this);

    QMenu *subMenu = menu.addMenu(tr("&New"));
    subMenu->addAction(tr("&JavaScript"), this, SLOT(newFile()));
    subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));

    menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
    menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
    menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

    menu.exec(QCursor::pos());
}

void NCodeWidget::newFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(ui->fileTreeView);
    qDebug() << parentPath;
    NUtil::newFile(parentPath, fileName, "js");
}

void NCodeWidget::newDir() {
    QString dirName = QInputDialog::getText(this, tr("New Directory"), tr("create new directory"));
    QString parentPath = NUtil::selectedPath(ui->fileTreeView);
    NUtil::newDir(parentPath, dirName);
}

void NCodeWidget::deletePath() {
    QString path = NUtil::selectedPath(ui->fileTreeView);
    bool isDir = QFileInfo(path).isDir();
    bool ret = NUtil::deletePath(path);

    if (ret) {
        updateTabForPathDeleted(path, isDir);
    }
}

void NCodeWidget::renamePath() {
    QString newName = QInputDialog::getText(this, tr("Rename File"), tr("enter new name"));
    QString srcPath = NUtil::selectedPath(ui->fileTreeView);
    QString newPath = NUtil::renamePath(srcPath, newName, "js");

    if (newPath.isEmpty()) {
        return;
    }

    updateTabForPathChanged(srcPath, newPath);
}

void NCodeWidget::copyPath() {
    QString newName = QInputDialog::getText(this, tr("Copy File"), tr("enter copy name"));
    QString srcPath = NUtil::selectedPath(ui->fileTreeView);
    NUtil::copyPath(srcPath, newName, "js");
}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
