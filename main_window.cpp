#include "main_window.h"
#include "ui_main_window.h"
#include "n_util.h"
#include "n_exec_widget.h"
#include "n_code_widget.h"
#include "n_layout_widget.h"
#include "n_image_widget.h"
#include "n_config_app_widget.h"
#include "n_config_scene_widget.h"
#include "n_config_page_widget.h"

#include <QFileDialog>
#include <QDebug>
#include <QScreen>
#include <QMessageBox>
#include <QInputDialog>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent), ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    mProjectDir = new QDir(QDir::homePath());
    mFileSysteMmodel = new QFileSystemModel;
    mFileSysteMmodel->setReadOnly(false);
    mFileTreeView = ui->fileTreeView;
    mFileTreeView->setModel(mFileSysteMmodel);
    mFileTreeView->hideColumn(1);
    mFileTreeView->hideColumn(2);
    mFileTreeView->hideColumn(3);
    mFileTreeView->hideColumn(4);
    mFileTabWidget = ui->fileTabWidget;
    mTabBackgroundWidget = ui->noFileWidget;

//    mExecWidget = new NExecWidget(this);

    connect(ui->actionNewProject, SIGNAL(triggered(bool)), this, SLOT(newProject()));
    connect(ui->actionOpenProject, SIGNAL(triggered(bool)), this, SLOT(openProject()));
    connect(ui->actionSaveAll, SIGNAL(triggered(bool)), this, SLOT(saveAll()));
    connect(ui->actionExec, SIGNAL(triggered(bool)), this, SLOT(execNavy()));
    connect(mFileTreeView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(mFileTreeView, SIGNAL(doubleClicked(QModelIndex)), this, SLOT(openFile(QModelIndex)));
    connect(mFileTreeView, SIGNAL(dropped(QString,QString)), this, SLOT(updateTabForDropped(QString,QString)));
    connect(mFileTabWidget, SIGNAL(tabCloseRequested(int)), this, SLOT(closeFile(int)));
}

void MainWindow::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    QString rootDirPath = mProjectDir->absolutePath();
    mFileSysteMmodel->setRootPath(rootDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    mFileTreeView->setRootIndex(mFileSysteMmodel->index(rootDirPath));

    mFileTabWidget->clear();
}

void MainWindow::newProject()
{
    QString dirName = QFileDialog::getSaveFileName(this, tr("New Project"), QDir::homePath() + "/Desktop");

    if (dirName.isEmpty()) {
        return;
    }

    //FIXME: remove this code.
    if (QFile::exists(dirName)) {
        if (!QDir(dirName).removeRecursively()){
            return;
        }
    }

    NUtil::copyDir(":/template", dirName);
    setCurrentProject(dirName);
}

void MainWindow::openProject() {
    QString dirName = QFileDialog::getExistingDirectory(this, tr("Open Project"), QDir::homePath() + "/Desktop");

    if (dirName.isEmpty()) {
        return;
    }

    if (!QFile::exists(dirName)) {
        return;
    }

    setCurrentProject(dirName);

    QDir(mProjectDir->absoluteFilePath("navy")).removeRecursively();
    QDir(mProjectDir->absoluteFilePath("creator")).removeRecursively();
    NUtil::copyDir(":/template/navy", mProjectDir->absoluteFilePath("navy"));
    NUtil::copyDir(":/template/creator", mProjectDir->absoluteFilePath("creator"));
}

void MainWindow::saveAll() {
    if (mProjectName.isEmpty()) {
        return;
    }

//    ui->nConfigWidget->saveConfig();
//    ui->nCodeWidget->saveAllFile();
//    ui->nLayoutWidget->saveAllFile();
}

void MainWindow::execNavy() {
    if (mProjectName.isEmpty()) {
        return;
    }

    mExecWidget->loadFile(mProjectDir->absoluteFilePath("index.html"));
    mExecWidget->activateWindow();
    mExecWidget->raise();
    mExecWidget->show();
}

QList<int> MainWindow::searchTabIndexesByPath(const QString &path, const bool &isDir) {
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

void MainWindow::updateTabForPathChanged(const QString &oldPath, const QString &newPath) {
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

void MainWindow::updateTabForDropped(QString dropDirPath, QString selectedFilePath) {
    QString fileName = QFileInfo(selectedFilePath).fileName();
    QString newFilePath = QDir(dropDirPath).absoluteFilePath(fileName);

    updateTabForPathChanged(selectedFilePath, newFilePath);
}

void MainWindow::updateTabForPathDeleted(const QString &path, const bool &isDir) {
    QList<int> indexes = searchTabIndexesByPath(path, isDir);

    for (int i = 0; i < indexes.length(); i++) {
        mFileTabWidget->removeTab(indexes[i]);
    }
}

void MainWindow::updateTabForCurrentFileContentChanged() {
    int tabIndex = mFileTabWidget->currentIndex();
    QString tabText = mFileTabWidget->tabText(tabIndex);

    if (tabText[tabText.length() - 1] != '*') {
        mFileTabWidget->setTabText(tabIndex, tabText + "*");
    }
}

bool MainWindow::isFileContentChanged(int tabIndex) {
    // 内容が編集されているものはタブ名の末尾がアスタリスクとなる
    // もうちょっとちゃんと管理したほうがよいQMap<QWidget *, bool>のような感じで
    QString tabName = mFileTabWidget->tabText(tabIndex);
    if (tabName[tabName.length() - 1] == '*') {
        return true;
    } else {
        return false;
    }
}

void MainWindow::openFile(QModelIndex index) {
    QString filePath = ((QFileSystemModel *) mFileTreeView->model())->filePath(index);
    if (QFileInfo(filePath).isDir()) {
        return;
    }

    QList<int> tabIndexes = searchTabIndexesByPath(filePath, false);

    // already open tab for file path;
    if (tabIndexes.length() > 0) {
        mFileTabWidget->setCurrentIndex(tabIndexes[0]);
        return;
    }

    QWidget *widget = NULL;
    if (filePath == mProjectDir->absoluteFilePath("config/app.json")) {
        widget = (QWidget*)new NConfigAppWidget(*mProjectDir, filePath);
    } else if (filePath == mProjectDir->absoluteFilePath("config/scene.json")) {
        widget = (QWidget*)new NConfigSceneWidget(*mProjectDir, filePath);
    } else if (filePath == mProjectDir->absoluteFilePath("config/page.json")) {
        widget = (QWidget*)new NConfigPageWidget(*mProjectDir, filePath);
    } else {
        QString ext = QFileInfo(filePath).suffix().toLower();
        if (ext == "js") {
            widget = (QWidget *) new NCodeWidget(*mProjectDir, filePath);
        } else if (ext == "json") {
            widget = (QWidget *) new NLayoutWidget(*mProjectDir, filePath);
        } else if (ext == "png") {
            widget = (QWidget *) new NImageWidget(*mProjectDir, filePath);
        } else if (ext == "jpeg") {
            widget = (QWidget *) new NImageWidget(*mProjectDir, filePath);
        } else if (ext == "jpg") {
            widget = (QWidget *) new NImageWidget(*mProjectDir, filePath);
        } else if (ext == "gif") {
            widget = (QWidget *) new NImageWidget(*mProjectDir, filePath);
        }
    }

    if (widget == NULL) {
        return;
    }

    QString fileName = QFileInfo(filePath).fileName();
    widget->setObjectName(filePath);
    int tabIndex = mFileTabWidget->addTab(widget, fileName);
    mFileTabWidget->setCurrentIndex(tabIndex);

    mFileTabWidget->show();
    mTabBackgroundWidget->hide();
}

void MainWindow::closeFile(int tabIndex) {
    if (!isFileContentChanged(tabIndex)) {
        mFileTabWidget->removeTab(tabIndex);
    } else {
        int ret = QMessageBox::question(this, tr("save file"), tr("do you save this file?"));
        if (ret == QMessageBox::Yes) {
            bool ret = saveFile(tabIndex);
            if (ret) {
                mFileTabWidget->removeTab(tabIndex);
            }
        }
    }

    if (mFileTabWidget->count() == 0) {
        mFileTabWidget->hide();
        mTabBackgroundWidget->show();
    }
}

bool MainWindow::saveFile(int tabIndex) {
    if (!isFileContentChanged(tabIndex)) {
        return true;
    }

    QWidget *widget = mFileTabWidget->widget(tabIndex);
    QString filePath = widget->objectName();
    QFile file(filePath);

    // fixme:
//    QString editedFileContent = this->editedFileContent(widget);
    QString editedFileContent('sample');

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

void MainWindow::saveAllFile() {
    int openFileNum = mFileTabWidget->count();
    for (int i = 0; i < openFileNum; i++) {
        saveFile(i);
    }
}

void MainWindow::newFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    //fixme
//    NUtil::newFile(parentPath, fileName, mFileExtension);
    NUtil::newFile(parentPath, fileName, "js");
}

void MainWindow::newDir() {
    QString dirName = QInputDialog::getText(this, tr("New Directory"), tr("create new directory"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newDir(parentPath, dirName);
}

void MainWindow::importPath() {
    //fixme
//    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), mImportFileExtension);
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), "Image (*.png)");

    QString parentPath = NUtil::selectedPath(mFileTreeView);
    for (int i = 0; i < files.length(); i++) {
        NUtil::importFile(parentPath, files[i]);
    }
}

void MainWindow::deletePath() {
    QString path = NUtil::selectedPath(mFileTreeView);
    bool isDir = QFileInfo(path).isDir();
    bool ret = NUtil::deletePath(path);

    if (ret) {
        updateTabForPathDeleted(path, isDir);
    }
}

void MainWindow::renamePath() {
    QString newName = QInputDialog::getText(this, tr("Rename File"), tr("enter new name"));
    QString srcPath = NUtil::selectedPath(mFileTreeView);
    QString ext = QFileInfo(srcPath).suffix();
    QString newPath = NUtil::renamePath(srcPath, newName, ext);

    if (newPath.isEmpty()) {
        return;
    }

    updateTabForPathChanged(srcPath, newPath);
}

void MainWindow::copyPath() {
    QString newName = QInputDialog::getText(this, tr("Copy File"), tr("enter copy name"));
    QString srcPath = NUtil::selectedPath(mFileTreeView);
    QString ext = QFileInfo(srcPath).suffix();
    NUtil::copyPath(srcPath, newName, ext);
}

void MainWindow::contextMenu(QPoint point) {
    QMenu menu(this);

    QMenu *subMenu = menu.addMenu(tr("&New"));
    //fixme
    //subMenu->addAction(mContextNewFileLabel, this, SLOT(newFile()));
    subMenu->addAction("javascript", this, SLOT(newFile()));
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

MainWindow::~MainWindow()
{
    delete ui;
}
