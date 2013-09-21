#include "n_code_widget.h"
#include "ui_n_code_widget.h"
#include "nutil.h"

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
    ui->codeTreeView->setModel(mFileSysteMmodel);
    ui->codeTreeView->hideColumn(1);
    ui->codeTreeView->hideColumn(2);
    ui->codeTreeView->hideColumn(3);
    ui->codeTreeView->hideColumn(4);
}

void NCodeWidget::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    QString codeDirPath = mProjectDir->absoluteFilePath("code");
    mFileSysteMmodel->setRootPath(codeDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    ui->codeTreeView->setRootIndex(mFileSysteMmodel->index(codeDirPath));

    ui->codeTabWidget->clear();
}

void NCodeWidget::saveCode() {
    /**
     * TODO: 現在は開いている全てのファイルをほぞんしているが、編集されたものだけを保存するようにすべき。
     * そのためにはファイルが編集されたら何らかの目印を付ける必要がある。
     * 例えばタブ名にアスタリスクをつけるなど.
     */

    int editingCodeNum = ui->codeTabWidget->count();
    for (int i = 0; i < editingCodeNum; i++) {
        QTextEdit *edit = (QTextEdit *)ui->codeTabWidget->widget(i);
        QString text = edit->toPlainText();
        QString filePath = edit->objectName();
        QFile file(filePath);
        if (!file.open(QFile::WriteOnly | QFile::Text)) {
            qDebug() << "fail file open. " + filePath;
            return;
        }
        file.write(text.toUtf8());
    }
}

void NCodeWidget::editCode(QModelIndex index) {
    QString filePath = ((QFileSystemModel *) ui->codeTreeView->model())->filePath(index);
    QList<int> tabIndexes = searchTabIndexesByPath(filePath, false);

    // already open tab for file path;
    if (tabIndexes.length() > 0) {
        ui->codeTabWidget->setCurrentIndex(tabIndexes[0]);
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
    int tabIndex = ui->codeTabWidget->addTab(textEdit, fileName);
    ui->codeTabWidget->setCurrentIndex(tabIndex);
}

void NCodeWidget::updateTabForPath(const QString &oldPath, const QString &newPath) {
    QFileInfo newPathInfo(newPath);
    QList<int> indexes  = searchTabIndexesByPath(oldPath, newPathInfo.isDir());

    for (int i = 0; i < indexes.length(); i++) {
        int index = indexes[i];
        QTextEdit *edit = (QTextEdit *)ui->codeTabWidget->widget(index);
        QString filePath = edit->objectName();
        filePath = newPath + filePath.remove(0, oldPath.length());
        edit->setObjectName(filePath);

        ui->codeTabWidget->setTabText(index, QFileInfo(filePath).fileName());
    }
}

void NCodeWidget::updateTabForDropped(QString dropDirPath, QString selectedFilePath) {
    QString fileName = QFileInfo(selectedFilePath).fileName();
    QString newFilePath = QDir(dropDirPath).absoluteFilePath(fileName);

    updateTabForPath(selectedFilePath, newFilePath);
}

void NCodeWidget::deleteTabForPath(const QString &path, const bool &isDir) {
    QList<int> indexes = searchTabIndexesByPath(path, isDir);

    for (int i = 0; i < indexes.length(); i++) {
        ui->codeTabWidget->removeTab(indexes[i]);
    }
}

QList<int> NCodeWidget::searchTabIndexesByPath(const QString &path, const bool &isDir) {
    QList<int> indexes;

    if (isDir) {
        int tabNum = ui->codeTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            QTextEdit *edit = (QTextEdit *)ui->codeTabWidget->widget(i);
            QString filePath = edit->objectName();
            if (filePath.indexOf(path) == 0) {
                indexes.append(i);
            }
        }
    } else {
        int tabNum = ui->codeTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            QTextEdit *edit = (QTextEdit *)ui->codeTabWidget->widget(i);
            QString filePath = edit->objectName();
            if (QString::compare(path, filePath) == 0) {
                indexes.append(i);
            }
        }
    }

    return indexes;
}

void NCodeWidget::contextMenu() {
    QMenu menu(this);
    menu.addAction(tr("&New"), this, SLOT(newFile()));
    menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
    menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
    menu.addAction(tr("&Delete"), this, SLOT(deletePath()));
    menu.addSeparator();
    menu.addAction(tr("&New Directory"), this, SLOT(newDir()));
    menu.exec(QCursor::pos());
}

void NCodeWidget::newFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(ui->codeTreeView);
    NUtil::newFile(parentPath, fileName, ".js");
}

void NCodeWidget::newDir() {
    QString dirName = QInputDialog::getText(this, tr("New Directory"), tr("create new directory"));
    QString parentPath = NUtil::selectedPath(ui->codeTreeView);
    NUtil::newDir(parentPath, dirName);
}

void NCodeWidget::deletePath() {
    QString path = NUtil::selectedPath(ui->codeTreeView);
    bool isDir = QFileInfo(path).isDir();
    bool ret = NUtil::deletePath(path);

    if (ret) {
        deleteTabForPath(path, isDir);
    }
}

void NCodeWidget::renamePath() {
    QString newName = QInputDialog::getText(this, tr("Rename File"), tr("enter new name"));
    QString srcPath = NUtil::selectedPath(ui->codeTreeView);
    QString newPath = NUtil::renamePath(srcPath, newName, ".js");

    if (newPath.isEmpty()) {
        return;
    }

    updateTabForPath(srcPath, newPath);
}

void NCodeWidget::copyPath() {
    QString newName = QInputDialog::getText(this, tr("Copy File"), tr("enter copy name"));
    QString srcPath = NUtil::selectedPath(ui->codeTreeView);
    NUtil::copyPath(srcPath, newName, ".js");
}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
