#include "main_window.h"
#include "ui_main_window.h"
#include "util/n_util.h"
#include "window/n_exec_widget.h"
#include "n_code_widget.h"
#include "n_layout_widget.h"
#include "n_image_widget.h"
#include "n_config_app_widget.h"
#include "n_config_scene_widget.h"
#include "n_config_page_widget.h"
#include "n_project.h"

#include <QFileDialog>
#include <QDebug>
#include <QScreen>
#include <QMessageBox>
#include <QInputDialog>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent), ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    ui->mainToolBar->hide();
    ui->statusBar->hide();
    ui->fileTabWidget->hide();

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

    mExecWidget = new NExecWidget(this);

    connect(ui->actionNewProject, SIGNAL(triggered(bool)), this, SLOT(newProject()));
    connect(ui->actionOpenProject, SIGNAL(triggered(bool)), this, SLOT(openProject()));
    connect(ui->actionSaveAll, SIGNAL(triggered(bool)), this, SLOT(saveAll()));
    connect(ui->actionExec, SIGNAL(triggered(bool)), this, SLOT(execNavy()));
    connect(ui->actionCloseTab, SIGNAL(triggered(bool)), this, SLOT(closeCurrentFile()));
    connect(ui->actionNextTab, SIGNAL(triggered(bool)), this, SLOT(nextFile()));
    connect(ui->actionPrevTab, SIGNAL(triggered(bool)), this, SLOT(prevFile()));

    connect(mFileTreeView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(mFileTreeView, SIGNAL(doubleClicked(QModelIndex)), this, SLOT(openFile(QModelIndex)));
    connect(mFileTreeView, SIGNAL(dropped(QString,QString)), this, SLOT(updateTabForDropped(QString,QString)));
    connect(mFileTabWidget, SIGNAL(tabCloseRequested(int)), this, SLOT(closeFile(int)));
    connect(mFileTabWidget, SIGNAL(currentChanged(int)), this, SLOT(tabChanged(int)));
}

void MainWindow::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    NProject::instance()->setProject(mProjectDir->absolutePath());

    QString rootDirPath = mProjectDir->absolutePath();
    mFileSysteMmodel->setRootPath(rootDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    mFileTreeView->setRootIndex(mFileSysteMmodel->index(rootDirPath));

    mFileTabWidget->clear();

    // 特定のファイルは非表示にする
    QModelIndex rootIndex = mFileTreeView->rootIndex();
    int row;
    row = mFileSysteMmodel->index(mProjectDir->absoluteFilePath("index.html")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);

    row = mFileSysteMmodel->index(mProjectDir->absoluteFilePath("index_creator.html")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);

    row = mFileSysteMmodel->index(mProjectDir->absoluteFilePath("creator")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);

    row = mFileSysteMmodel->index(mProjectDir->absoluteFilePath("navy")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);
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

    QTabWidget *tab = ui->fileTabWidget;
    for (int i = 0; i < tab->count(); i++) {
        saveFile(i);
    }
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
            NFileWidget *widget = (NFileWidget *)mFileTabWidget->widget(i);
            QString filePath = widget->filePath();
            if (filePath.indexOf(path) == 0) {
                indexes.append(i);
            }
        }
    } else {
        int tabNum = mFileTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            NFileWidget *widget = (NFileWidget *)mFileTabWidget->widget(i);
            QString filePath = widget->filePath();
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
        NFileWidget *fileWidget = (NFileWidget *)mFileTabWidget->widget(index);
        QString filePath = fileWidget->filePath();
        filePath = newPath + filePath.remove(0, oldPath.length());
        fileWidget->setFilePath(filePath);

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

void MainWindow::updateTabForFileChanged(NFileWidget *fileWidget) {
    int tabIndex = mFileTabWidget->indexOf(fileWidget);
    if (tabIndex == -1) {
        return;
    }

    QString tabText = mFileTabWidget->tabText(tabIndex);

    if (tabText[tabText.length() - 1] != '*') {
        mFileTabWidget->setTabText(tabIndex, tabText + "*");
    }
}

bool MainWindow::isFileContentChanged(int tabIndex) {
    NFileWidget *fileWidget = (NFileWidget *)mFileTabWidget->widget(tabIndex);
    return fileWidget->isChanged();
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

    NFileWidget *fileWidget = NULL;
    if (filePath == mProjectDir->absoluteFilePath("config/app.json")) {
        fileWidget = new NConfigAppWidget(*mProjectDir, filePath);
    } else if (filePath == mProjectDir->absoluteFilePath("config/scene.json")) {
        fileWidget = new NConfigSceneWidget(*mProjectDir, filePath);
    } else if (filePath == mProjectDir->absoluteFilePath("config/page.json")) {
        fileWidget = new NConfigPageWidget(*mProjectDir, filePath);
    } else {
        QString ext = QFileInfo(filePath).suffix().toLower();
        if (ext == "js") {
            fileWidget = new NCodeWidget(*mProjectDir, filePath);
        } else if (ext == "json") {
            fileWidget = new NLayoutWidget(*mProjectDir, filePath);
        } else if (ext == "png") {
            fileWidget = new NImageWidget(*mProjectDir, filePath);
        } else if (ext == "jpeg") {
            fileWidget = new NImageWidget(*mProjectDir, filePath);
        } else if (ext == "jpg") {
            fileWidget = new NImageWidget(*mProjectDir, filePath);
        } else if (ext == "gif") {
            fileWidget = new NImageWidget(*mProjectDir, filePath);
        }
    }

    if (fileWidget == NULL) {
        return;
    }

    connect(fileWidget, SIGNAL(changed(NFileWidget*)), this, SLOT(updateTabForFileChanged(NFileWidget*)));

    QString fileName = QFileInfo(filePath).fileName();
    fileWidget->setObjectName(filePath);
    int tabIndex = mFileTabWidget->addTab(fileWidget, fileName);
    mFileTabWidget->setCurrentIndex(tabIndex);

    mFileTabWidget->show();
    mTabBackgroundWidget->hide();
}

void MainWindow::closeFile(int tabIndex) {
    if (isFileContentChanged(tabIndex)) {
        QMessageBox msgBox;
        msgBox.setText("this file has been modified.");
        msgBox.setInformativeText("do you want to save your changes?");
        msgBox.setStandardButtons(QMessageBox::Save | QMessageBox::Discard | QMessageBox::Cancel);
        msgBox.setDefaultButton(QMessageBox::Save);
        int ret = msgBox.exec();

        switch (ret) {
        bool saveResult;
        case QMessageBox::Save:
            saveResult = saveFile(tabIndex);
            if (!saveResult) {
                return;
            }
            break;
        case QMessageBox::Discard:
            break;
        case QMessageBox::Cancel:
            return;
            break;
        }
    }

    mFileTabWidget->removeTab(tabIndex);

    if (mFileTabWidget->count() == 0) {
        mFileTabWidget->hide();
        mTabBackgroundWidget->show();
    }
}

void MainWindow::closeCurrentFile() {
    int index = mFileTabWidget->currentIndex();
    closeFile(index);
}

void MainWindow::nextFile() {
    int index = mFileTabWidget->currentIndex();
    if (index + 1 < mFileTabWidget->count()) {
        mFileTabWidget->setCurrentIndex(index + 1);
    }
}

void MainWindow::prevFile() {
    int index = mFileTabWidget->currentIndex();
    if (index - 1 >= 0 ) {
        mFileTabWidget->setCurrentIndex(index - 1);
    }
}

bool MainWindow::saveFile(int tabIndex) {
    if (!isFileContentChanged(tabIndex)) {
        return true;
    }

    NFileWidget *fileWidget = (NFileWidget *)mFileTabWidget->widget(tabIndex);
    int ret = fileWidget->save();
    if (ret == -1) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail save file.") + "\n" + fileWidget->filePath());
        return false;
    }

    // 保存が完了したのでタブ名の*を取り除く
    QString tabName = mFileTabWidget->tabText(tabIndex);
    mFileTabWidget->setTabText(tabIndex, tabName.remove(tabName.length() - 1, 1));

    return true;
}

void MainWindow::newJSFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newFile(parentPath, fileName, "js");
}

void MainWindow::newLayoutFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);

    QString filePath = NUtil::createFilePath(parentPath, fileName, "json");
    if (filePath.isEmpty()) {
        return;
    }

    NUtil::createFileFromTemplate(":/template_code/layout.json", filePath);
}

void MainWindow::newDir() {
    QString dirName = QInputDialog::getText(this, tr("New Directory"), tr("create new directory"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newDir(parentPath, dirName);
}

void MainWindow::importJS() {
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), "Text (*.js)");

    QString parentPath = NUtil::selectedPath(mFileTreeView);
    for (int i = 0; i < files.length(); i++) {
        NUtil::importFile(parentPath, files[i]);
    }
}

void MainWindow::importLayout() {
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), "Text (*.json)");

    QString parentPath = NUtil::selectedPath(mFileTreeView);
    for (int i = 0; i < files.length(); i++) {
        NUtil::importFile(parentPath, files[i]);
    }
}

void MainWindow::importImage() {
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), "Image (*.png *.gif *.jpge *.jpg)");

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
    // 選択されたところが何もない場所なら、操作を何もさせない
    QModelIndex index = mFileTreeView->indexAt(point);
    if (!index.isValid()) {
        mFileTreeView->setCurrentIndex(mFileTreeView->rootIndex());
        mFileTreeView->clearSelection();
        return;
    }

    QString filePath = mFileSysteMmodel->filePath(index);
    if (filePath.indexOf(mProjectDir->absoluteFilePath("code")) == 0) {
        QMenu menu(this);
        QMenu *subMenu = menu.addMenu(tr("&New"));
        subMenu->addAction("javascript", this, SLOT(newJSFile()));
        subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));
        menu.addAction(tr("&Import"), this, SLOT(importJS()));
        menu.addSeparator();
        menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
        menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
        menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

        menu.exec(QCursor::pos());
        return;
    }

    if (filePath.indexOf(mProjectDir->absoluteFilePath("layout")) == 0) {
        QMenu menu(this);
        QMenu *subMenu = menu.addMenu(tr("&New"));
        subMenu->addAction("layout", this, SLOT(newLayoutFile()));
        subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));
        menu.addAction(tr("&Import"), this, SLOT(importLayout()));
        menu.addSeparator();
        menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
        menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
        menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

        menu.exec(QCursor::pos());
        return;
    }

    if (filePath.indexOf(mProjectDir->absoluteFilePath("image")) == 0) {
        QMenu menu(this);
        QMenu *subMenu = menu.addMenu(tr("&New"));
        subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));
        menu.addAction(tr("&Import"), this, SLOT(importImage()));
        menu.addSeparator();
        menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
        menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
        menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

        menu.exec(QCursor::pos());
        return;
    }
}

void MainWindow::tabChanged(int index) {
    NFileWidget *widget = (NFileWidget *)mFileTabWidget->widget(index);
    if (widget == NULL) {
        return;
    }

    widget->refreshForActive();
}

MainWindow::~MainWindow()
{
    delete ui;
}
